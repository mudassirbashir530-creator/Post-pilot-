import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'development_nextauth_secret_key_32bytes_long!!',
  });

  const { pathname } = req.nextUrl;

  // Unprotected / Public API Routes Exception List
  const isPublicApi =
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/auto-reply') ||
    pathname.startsWith('/api/temp-image') ||
    pathname.startsWith('/api/cron/daily-post');

  // Protect /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/*
  if (pathname.startsWith('/api') && !isPublicApi) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
