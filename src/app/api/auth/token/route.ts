import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const accessTokenUrl = process.env.URL_ACCESS_TOKEN!;
    const credentials = process.env.CLIENT_SECRET!;
    const scope = process.env.SCOPE!;

    // Generate RqUID (Unique request identifier)
    const rqUID = uuidv4();

    // Prepare headers
    const headers = {
      RqUID: rqUID, // Match this to your cURL command
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${credentials}`,
    };

    // Prepare form-data for the body
    const formData = new URLSearchParams();
    formData.append('scope', scope);

    // Create an HTTPS agent that allows self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Make the POST request to get access token
    const response = await axios.post(
      accessTokenUrl,
      formData.toString(),
      { headers, httpsAgent }
    );

    // Send the access token back to the frontend
    return NextResponse.json(
      { access_token: response.data.access_token },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      'Error fetching access token:',
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        message: 'Failed to fetch access token',
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
