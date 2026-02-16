import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/settings'; 

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check si la ruta ya tiene locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // 2. Si no tiene locale, redirigir al default
  const locale = defaultLocale;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // AJUSTE CLAVE: Añadido '|data' a la lista de exclusiones (negative lookahead)
  // Esto evita que Next.js intente traducir las rutas de tus JSONs
  matcher: [
    '/((?!api|_next/static|_next/image|images|img|favicon.ico|data).*)',
  ],
};
