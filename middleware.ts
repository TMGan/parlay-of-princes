import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = new Set(['/', '/login', '/register']);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === 'ADMIN';

  const isPublic = PUBLIC_ROUTES.has(pathname);
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminPage = pathname.startsWith('/admin');

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect unauthenticated users to login, preserving intended destination
  if (!isPublic && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect non-admins away from admin pages
  if (isAdminPage && isLoggedIn && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Exclude API routes, Next.js internals, and static files — they handle auth themselves
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
