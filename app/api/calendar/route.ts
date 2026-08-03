import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// Setup for Google Calendar API
// In production, we'll configure these environment variables:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

export async function POST(request: Request) {
  try {
    const { prospectId } = await request.json();

    if (!prospectId) {
      return NextResponse.json({ error: 'prospectId is required' }, { status: 400 });
    }

    // Connect to Supabase to fetch prospect details and save meeting info
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('contact_name, contact_email, business_name')
      .eq('id', prospectId)
      .single();

    if (fetchError || !prospect) {
      throw new Error('Prospect not found');
    }

    // Initialize Google Auth with refresh token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Google Calendar credentials not fully configured');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Schedule for 2 days from now as a default placeholder
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 2);
    startTime.setHours(10, 0, 0, 0); // 10:00 AM
    
    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0); // 11:00 AM

    const event = {
      summary: `SwiftKDS Consultation: ${prospect.business_name}`,
      description: `Discovery call with ${prospect.contact_name}.`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York', // You can adjust this default
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: prospect.contact_email }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${prospectId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: event,
    });

    const meetingLink = response.data.hangoutLink || '';
    const meetingTime = response.data.start?.dateTime || startTime.toISOString();

    // Update prospect in DB
    const { error: updateError } = await supabase
      .from('prospects')
      .update({
        meeting_id: meetingLink,
        meeting_time: meetingTime,
      })
      .eq('id', prospectId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      meetingId: meetingLink,
      meetingTime: meetingTime
    });

  } catch (error: any) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule meeting' },
      { status: 500 }
    );
  }
}
