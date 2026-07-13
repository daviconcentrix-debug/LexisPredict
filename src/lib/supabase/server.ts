
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * MOTOR DE IDENTIDADE SSR (W1 CAPITAL)
 * Garante que as Server Actions reconheçam a sessão do usuário logado.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://segjskjlbeydlljnefai.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yEX6mVid3dpC7o7eOzuB1g_VhQodoTg',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorado em Server Components
          }
        },
      },
    }
  )
}
