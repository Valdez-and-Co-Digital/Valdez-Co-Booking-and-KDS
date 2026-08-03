import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const redirectUrl = new URL(next, origin);
      
      if (!isLocalEnv) {
        redirectUrl.protocol = 'https:';
      }
      
      return NextResponse.redirect(redirectUrl.toString());
    }
  }

  // return the user to homepage/login if auth fails
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
