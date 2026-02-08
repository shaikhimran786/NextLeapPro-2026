import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/onboarding'];
const ADMIN_ROUTES = ['/admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session')?.value;
  const adminSessionToken = request.cookies.get('admin_session')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some(r => pathname.startsWith(r));

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !adminSessionToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/onboarding/:path*', '/admin/:path*'],
};
