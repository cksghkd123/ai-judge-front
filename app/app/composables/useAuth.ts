import type { Session, User } from '@supabase/supabase-js'

let authListenerInitialized = false

/**
 * 전역 인증 상태(세션/유저)와 로그아웃을 제공하는 composable.
 * 앱 전역에서 한 번만 onAuthStateChange를 구독한다.
 */
export function useAuth() {
  const supabase = useNuxtApp().$supabase
  const user = useState<User | null>('auth-user', () => null)
  const session = useState<Session | null>('auth-session', () => null)
  const isReady = useState('auth-is-ready', () => false)

  if (supabase && !authListenerInitialized) {
    authListenerInitialized = true
    supabase.auth.getSession().then(({ data }) => {
      session.value = data.session
      user.value = data.session?.user ?? null
      isReady.value = true
    })
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const isLoggedIn = computed(() => Boolean(user.value))

  return { user, session, isReady, isLoggedIn, signOut }
}
