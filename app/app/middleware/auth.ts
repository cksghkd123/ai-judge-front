/**
 * 로그인 필요 라우트 보호.
 * 세션이 없으면 /sign-in으로 리다이렉트한다.
 * 서버에서는 쿠키 기반 세션을 읽지 못하므로 검사 생략 → 클라이언트에서만 검사해 새로고침 시 /sign-in 경유 방지.
 */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const supabase = useNuxtApp().$supabase
  if (!supabase) {
    return navigateTo('/sign-in')
  }
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    return navigateTo('/sign-in')
  }
})
