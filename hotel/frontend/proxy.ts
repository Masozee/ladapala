import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public paths without auth check
  if (pathname === '/' ||
      pathname === '/login' ||
      pathname.startsWith('/customers') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/static/') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.js')) {
    return NextResponse.next();
  }

  // Check for frontend auth cookie (set by login page on this domain)
  const authCookie = request.cookies.get('auth-token');

  // If no auth cookie, redirect to login
  if (!authCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth cookie exists - proceed with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
