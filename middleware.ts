import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * SwiftKDS Next.js Middleware (using modern @supabase/ssr)
 *
 * Responsibilities:
 * 1. Refresh Supabase auth session on every request
 * 2. Resolve tenant_id from hostname (custom domain) or URL slug
 * 3. Pass tenant context via request headers to layouts/pages
 */
export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      await supabase.auth.getUser();
    } catch {
      // Allow previewing UI without active Supabase instance
    }
  }

  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') ?? '';

  // Resolve tenant slug
  const slug = resolveTenantSlug(hostname, pathname);
  if (slug) {
    response.headers.set('x-tenant-slug', slug);
  }

  // Resolve custom domain
  const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'swiftkds.com';
  if (!hostname.endsWith(baseDomain) && !hostname.includes('localhost')) {
    response.headers.set('x-tenant-domain', hostname);
  }

  return response;
}

function resolveTenantSlug(hostname: string, pathname: string): string | null {
  const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'swiftkds.com';

  if (hostname.endsWith(`.${baseDomain}`)) {
    const subdomain = hostname.replace(`.${baseDomain}`, '');
    if (subdomain && !['www', 'app', 'admin', 'api'].includes(subdomain)) {
      return subdomain;
    }
  }

  const match = pathname.match(/^\/book\/([a-z0-9-]+)/);
  if (match?.[1]) return match[1];

  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|sounds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
