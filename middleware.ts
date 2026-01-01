import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define route types
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/bets') ||
                          pathname.startsWith('/leaderboard') ||
                          pathname.startsWith('/profile') ||
                          pathname.startsWith('/admin');
  
  // For now, allow all traffic (we'll add proper auth checks later)
  // This is a simplified version that won't block routes during development
  if (isAuthPage || isProtectedPage) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/bets/:path*', '/leaderboard/:path*', '/profile/:path*', '/admin/:path*', '/login', '/register'],
};