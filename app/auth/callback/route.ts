import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Build the redirect URL first so we can attach cookies to it
    const isLocalEnv = process.env.NODE_ENV === 'development';
    const host = request.headers.get('x-forwarded-host') ?? new URL(request.url).host;
    const protocol = isLocalEnv ? 'http' : 'https';
    const redirectTo = `${protocol}://${host}${next}`;

    const redirectResponse = NextResponse.redirect(redirectTo);

    // Create a Supabase client that reads cookies from the request
    // and writes them DIRECTLY onto our redirect response
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.headers
              .get('cookie')
              ?.split('; ')
              .map((c) => {
                const [name, ...rest] = c.split('=');
                return { name, value: rest.join('=') };
              }) ?? [];
          },
          setAll(cookiesToSet) {
            // Write session cookies directly onto the redirect response
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, {
                ...options,
                // Ensure cookies are secure and accessible on the main domain
                sameSite: 'lax',
                secure: !isLocalEnv,
                httpOnly: true,
                path: '/',
              });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectResponse;
    }
  }

  // Auth failed — send back to home with error flag
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
