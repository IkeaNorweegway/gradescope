import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow login page and login/logout API
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login') || pathname.startsWith('/api/logout')) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('gs_auth')?.value;
  const correct = process.env.APP_PASSWORD;

  if (!correct || auth !== correct) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
