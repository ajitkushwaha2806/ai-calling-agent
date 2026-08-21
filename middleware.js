import { NextResponse } from 'next/server';

export function middleware(request) {
  const authSession = request.cookies.get('auth_session');
  
  // Exclude static files, api auth routes, and login page
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/admin/login' ||
    pathname === '/login' ||
    pathname.includes('.') // Exclude static files (images, favicons, etc.)
  ) {
    return NextResponse.next();
  }

  if (!authSession || authSession.value !== 'authenticated') {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
