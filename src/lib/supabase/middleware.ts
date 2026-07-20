/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Motor de Gestão de Sessão v1000.0 ELITE
 * Otimizado para ignorar arquivos estáticos e prevenir loops de redirecionamento.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Filtro de Exceção para Arquivos de Sistema e Estáticos
  const { pathname } = request.nextUrl;
  const isStaticAsset = /\.(png|jpg|jpeg|gif|webp|svg|ico|json|txt|webmanifest)$/i.test(pathname);
  const isSystemPath = pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/icons');
  
  if (isStaticAsset || isSystemPath) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Validação de Identidade
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = pathname === '/login' || pathname === '/signup'

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}
