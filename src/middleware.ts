import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// CORRECCIÓN: Usamos el alias '@' para apuntar a la raíz de 'src' de forma segura
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
  // Matcher optimizado para ignorar estáticos
  matcher: [
    '/((?!_next/static|_next/image|images|img|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};