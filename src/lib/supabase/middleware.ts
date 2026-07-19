/**
 * @copyright 2026 Davi Alves Figueredo / W1 Capital Assessoria Financeira Ltda.
 * @license Proprietary - All rights reserved. See LICENSE file.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Fallbacks de segurança caso as variáveis de ambiente não estejam propagadas no Vercel
const DEFAULT_URL = 'https://segjskjlbeydlljnefai.supabase.co';
const DEFAULT_KEY = 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Recupera o usuário de forma resiliente usando getUser() (seguro para SSR)
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = ['/login', '/signup'].includes(request.nextUrl.pathname);

  // Redirecionamento de segurança: se não houver usuário e não estiver na tela de login/signup, vai para login
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirecionamento de conveniência: se já estiver logado e tentar ir para login, vai para a home
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}
