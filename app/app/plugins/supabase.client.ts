import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

/** PKCE code verifier를 쿠키에 저장해 리다이렉트 후에도 유지 (SSR/다른 탭 대응) */
export default defineNuxtPlugin<{ supabase: SupabaseClient | null }>(() => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl as string | undefined
  const supabasePublishableKey = config.public.supabasePublishableKey as string | undefined

  if (!supabaseUrl || !supabasePublishableKey) {
    console.error('Supabase env vars are missing')
    return {
      provide: {
        supabase: null
      }
    }
  }

  const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey)

  return {
    provide: {
      supabase
    }
  }
})
