// /app/api/speech/recognize/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import { PrismaClient } from '@prisma/client';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // 1. Get the access token
    const accessToken = await getAccessToken();

    // 2. Get the audio file and field ID from the request
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const id = formData.get('id') as string;

    if (!file || !id) {
      return NextResponse.json({ message: 'No file or ID provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const convertedBuffer = await convertWebmToMp3(file);
    // const arrayBuffer = await file.arrayBuffer();
    // const buffer = Buffer.from(arrayBuffer);

    // 3. Upload the audio file
    const requestFileId = await uploadAudioFile(accessToken, convertedBuffer);

    // 4. Initiate speech recognition
    const taskId = await startSpeechRecognition(accessToken, requestFileId);

    // 5. Process transcription asynchronously
    processTranscription(accessToken, taskId, parseInt(id));

    // 6. Return immediately without waiting
    return NextResponse.json({ message: 'Audio received, processing started' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in speech recognition:', error);
    return NextResponse.json(
      { message: 'Speech recognition failed', error: error.message },
      { status: 500 }
    );
  }
}

async function convertWebmToMp3(file: File): Promise<Buffer> {
  // Create temporary file paths
  const inputPath = join(tmpdir(), `input-${Date.now()}.webm`);
  const outputPath = join(tmpdir(), `output-${Date.now()}.mp3`);

  try {
    // Write input file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(inputPath, buffer);

    // Convert using ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .outputOptions([
          '-acodec libmp3lame',
          '-ab 128k', // Bitrate
          '-ar 44100', // Sample rate
          '-ac 2', // Number of audio channels (stereo)
        ])
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });

    // Read the converted file
    const convertedBuffer = await require('fs/promises').readFile(outputPath);

    // Cleanup temporary files
    await Promise.all([
      unlink(inputPath),
      unlink(outputPath),
    ]);

    return convertedBuffer;
  } catch (error) {
    // Cleanup in case of error
    try {
      await Promise.all([
        unlink(inputPath),
        unlink(outputPath),
      ].map(p => p.catch(() => {})));
    } catch {}
    throw error;
  }
}

// Helper functions

async function getAccessToken(): Promise<string> {
  const accessTokenUrl = process.env.URL_ACCESS_TOKEN!;
  const credentials = process.env.CLIENT_SECRET!;
  const scope = process.env.SCOPE!;

  const rqUID = uuidv4();

  const headers = {
    RqUID: rqUID,
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Bearer ${credentials}`,
  };

  const formData = new URLSearchParams();
  formData.append('scope', scope);

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const response = await axios.post(accessTokenUrl, formData.toString(), {
    headers,
    httpsAgent,
  });

  return response.data.access_token;
}

async function uploadAudioFile(accessToken: string, buffer: Buffer): Promise<string> {
  const uploadUrl = `${process.env.URL_REST}/data:upload`;

  const formData = new FormData();
  formData.append('file', buffer, 'audio.mp3');

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...formData.getHeaders(),
  };

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const response = await axios.post(uploadUrl, formData, {
    headers,
    httpsAgent,
  });

  return response.data.result.request_file_id;
}

async function startSpeechRecognition(accessToken: string, requestFileId: string): Promise<string> {
  const recognizeUrl = `${process.env.URL_REST}/speech:async_recognize`;

  const data = {
    options: {
      // model: 'general',
      audio_encoding: 'MP3', // Update as per your audio encoding
      // sample_rate: 16000, // Update as per your recording settings
      channels_count: 1,
    },
    request_file_id: requestFileId,
  };

  const headers = {
    'Content-Type': 'audio/mpeg',
    Authorization: `Bearer ${accessToken}`,
  };

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const response = await axios.post(recognizeUrl, data, {
    headers,
    httpsAgent,
  });

  return response.data.result.id;
}

async function processTranscription(accessToken: string, taskId: string, fieldId: number) {
  try {
    // 5. Poll for recognition status
    const responseFileId = await pollRecognitionStatus(accessToken, taskId);

    // 6. Download the transcription
    const transcription = await downloadTranscription(accessToken, responseFileId);

    // 7. Save the transcription to the database
    await prisma.transcription.create({
      data: {
        fieldId,
        transcription,
      },
    });
  } catch (error) {
    console.error('Error processing transcription:', error);
  }
}

async function pollRecognitionStatus(accessToken: string, taskId: string): Promise<string> {
  const statusUrl = `${process.env.URL_REST}/task:get?id=${taskId}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  // Polling loop
  while (true) {
    const response = await axios.get(statusUrl, {
      headers,
      httpsAgent,
    });

    const status = response.data.result.status;

    if (status === 'DONE') {
      return response.data.result.response_file_id;
    } else if (status === 'ERROR') {
      throw new Error(response.data.result.error);
    } else {
      // Status is 'PROCESSING' or other, wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
  }
}

async function downloadTranscription(accessToken: string, responseFileId: string): Promise<string> {
  const downloadUrl = `${process.env.URL_REST}/data:download?response_file_id=${responseFileId}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  const response = await axios.get(downloadUrl, {
    headers,
    httpsAgent,
  });

   // Assuming the response is an array of transcription results as shown in the example.
   const transcriptionData = response.data;

   // Extract the 'normalized_text' from all results and join them into a single transcription.
   const transcription = transcriptionData
     .map((item: any) => item.results[0]?.normalized_text || "")
     .filter(Boolean) // Remove empty strings
     .join(" ");

   return transcription; // Assuming the response body contains the transcription text
}
