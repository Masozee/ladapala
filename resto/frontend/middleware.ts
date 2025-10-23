import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register']

// Routes that require authentication
const protectedRoutes = ['/', '/dashboard', '/menu', '/meja', '/transaksi', '/laporan', '/settings', '/profile']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route requires authentication
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Allow public routes and static files
  if (isPublicRoute || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (isProtectedRoute) {
    // Get session cookie from request
    const sessionId = request.cookies.get('sessionid')

    if (!sessionId) {
      // No session cookie, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify session is valid on server
    try {
      const response = await fetch(`${API_URL}/user/check-session/`, {
        method: 'GET',
        headers: {
          'Cookie': `sessionid=${sessionId.value}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        // Session invalid, redirect to login
        const url = new URL('/login', request.url)
        const redirectResponse = NextResponse.redirect(url)
        // Clear the invalid session cookie
        redirectResponse.cookies.delete('sessionid')
        redirectResponse.cookies.delete('csrftoken')
        return redirectResponse
      }

      // Session valid, allow access
      return NextResponse.next()
    } catch (error) {
      // Error checking session, redirect to login for safety
      console.error('Session check error:', error)
      const url = new URL('/login', request.url)
      const redirectResponse = NextResponse.redirect(url)
      redirectResponse.cookies.delete('sessionid')
      redirectResponse.cookies.delete('csrftoken')
      return redirectResponse
    }
  }

  // For other routes, allow access
  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
