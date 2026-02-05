/**
 * 로그인 필요 라우트 보호.
 * 세션이 없으면 /sign-in으로 리다이렉트한다.
 */
export default defineNuxtRouteMiddleware(async () => {
  const supabase = useNuxtApp().$supabase
  if (!supabase) {
    return navigateTo('/sign-in')
  }
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    return navigateTo('/sign-in')
  }
})
