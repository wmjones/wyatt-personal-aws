import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add routes that require authentication
const protectedRoutes = ['/demand-planning', '/settings'];

// Add routes that should redirect to demand planning if already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password', '/confirm-signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Get the token from cookies (this will be set by Amplify)
  const token = request.cookies.get('CognitoIdentityServiceProvider.UserPoolClientId.idToken');

  // Handle root path - redirect based on auth status
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/demand-planning', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to demand planning if accessing auth route with token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/demand-planning', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
