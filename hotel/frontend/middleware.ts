import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and public assets
  if (pathname.startsWith('/login') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)) {
    return NextResponse.next();
  }

  // Get access level from cookies or localStorage (stored during login)
  // Note: In middleware, we can't access localStorage, so we'll redirect to a check page
  // that will handle client-side access verification

  // For now, we'll add a header that client components can check
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
