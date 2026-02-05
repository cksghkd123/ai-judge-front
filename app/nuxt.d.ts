import type { Ref, ComputedRef } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

declare global {
  function useAuth(): {
    user: Ref<User | null>
    session: Ref<Session | null>
    isReady: Ref<boolean>
    isLoggedIn: ComputedRef<boolean>
    signOut: () => Promise<void>
  }
}

declare module '#app' {
  interface NuxtApp {
    $supabase: SupabaseClient | null
  }
}

declare module 'nuxt/app' {
  interface NuxtApp {
    $supabase: SupabaseClient | null
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient | null
  }
}

export {}
