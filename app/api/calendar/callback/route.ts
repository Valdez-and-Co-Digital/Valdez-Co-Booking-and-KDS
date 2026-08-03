import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: 'OAuth failed', details: error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/calendar/callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // In a multi-tenant app, we'd save this to the database.
    // For this single-agency setup, we just need to print it so the admin can save it to .env
    
    const html = `
      <html>
        <body style="background: #111; color: #eee; font-family: sans-serif; padding: 40px; line-height: 1.6;">
          <div style="max-w-2xl mx-auto bg-[#222] p-8 rounded-xl border border-[#333]">
            <h1 style="color: #4ade80;">✅ Success! Google Calendar Connected.</h1>
            <p>We received your refresh token. This token allows SwiftKDS to generate Google Meet links automatically.</p>
            
            <h3 style="margin-top: 2rem;">Next Step:</h3>
            <p>Copy the following token and add it to your <code>.env.local</code> (and Vercel) as <code>GOOGLE_REFRESH_TOKEN</code>:</p>
            
            <div style="background: #000; padding: 16px; border-radius: 8px; margin: 16px 0; word-break: break-all; font-family: monospace; color: #22d3ee;">
              ${tokens.refresh_token || "NO REFRESH TOKEN RECEIVED. (You might need to revoke access in your Google Account and try again to force a new refresh token)."}
            </div>
            
            <p>Once you've added it to your .env file, restart your Next.js server.</p>
            
            <a href="/dashboard/onboarding" style="display: inline-block; margin-top: 2rem; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 8px;">Back to Dashboard</a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    });

  } catch (err: any) {
    console.error('Error exchanging token', err);
    return NextResponse.json({ error: 'Failed to exchange token', details: err.message }, { status: 500 });
  }
}
