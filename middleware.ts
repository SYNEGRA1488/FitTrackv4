import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Простая проверка токена без использования jsonwebtoken (для Edge Runtime)
function verifyTokenSimple(token: string): { userId: string; email: string } | null {
  try {
    // Простая проверка формата JWT (без полной валидации подписи в Edge Runtime)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Декодируем base64 без Buffer (для Edge Runtime)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // Проверяем срок действия
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/register', '/onboarding'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If accessing login/register with valid token, redirect to dashboard
  // НО НЕ редиректим с onboarding - там может быть незаполненный профиль
  if ((pathname === '/login' || pathname === '/register') && token) {
    const payload = verifyTokenSimple(token);
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If accessing protected route without token, redirect to login
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token is invalid, clear it and redirect
  if (token && !isPublicRoute) {
    const payload = verifyTokenSimple(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)'],
};


