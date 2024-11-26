// src/app/api/data/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Endpoint to get all transcriptions
export async function GET() {
  try {
    const transcriptions = await prisma.transcription.findMany();

    // Convert array of transcriptions to an object keyed by fieldId
    const transcriptionMap: { [key: number]: string } = {};
    transcriptions.forEach((item) => {
      transcriptionMap[item.fieldId] = item.transcription;
    });

    return NextResponse.json(transcriptionMap, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching transcriptions:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
