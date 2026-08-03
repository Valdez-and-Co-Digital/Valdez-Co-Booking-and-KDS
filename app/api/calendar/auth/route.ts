import { NextResponse } from 'next/navigation';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Use the origin from the request or fallback to localhost
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/calendar/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google Credentials not configured in .env' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to receive a refresh token
    prompt: 'consent',      // Force consent to ensure we get a refresh token every time
    scope: scopes,
  });

  return NextResponse.redirect(authUrl);
}
