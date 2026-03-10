import { createServerClient } from '@supabase/ssr'
import { parse, serialize } from 'cookie'
import { getHeader, getQuery, appendResponseHeader, sendRedirect, createError } from 'h3'

/**
 * OAuth 콜백: 서버에서 code ↔ session 교환 (PKCE code_verifier는 요청 쿠키에 있음).
 * 리다이렉트 후 같은 도메인으로 돌아오므로 쿠키가 전달되고, 교환 후 세션 쿠키를 설정해 /dashboard로 보냄.
 */
/** 로그인 후 돌아갈 경로. 같은 오리진 경로만 허용 (예: /cases/xxx?token=yyy) */
function getAllowedRedirect(redirect: string | undefined): string | null {
  if (!redirect || typeof redirect !== 'string') return null
  const decoded = decodeURIComponent(redirect)
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  return decoded
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const redirectRaw = query.redirect as string | undefined
  if (!code) {
    throw createError({ statusCode: 400, message: 'Missing code' })
  }
  const redirect = getAllowedRedirect(redirectRaw)

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabasePublishableKey as string
  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }

  const cookieHeader = getHeader(event, 'cookie') || ''

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll(_keyHints?: string[]) {
        return Object.entries(parse(cookieHeader)).map(([name, value]) => ({
          name,
          value: value ?? '',
        }))
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        for (const { name, value, options } of cookiesToSet) {
          appendResponseHeader(event, 'Set-Cookie', serialize(name, value, options || {}))
        }
      },
    },
  })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return sendRedirect(event, `/sign-in?error=${encodeURIComponent(error.message)}`, 302)
  }
  if (!data.session) {
    return sendRedirect(event, '/sign-in?error=no_session', 302)
  }

  const target = redirect || '/dashboard'
  return sendRedirect(event, target, 302)
})
