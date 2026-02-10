import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

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

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true
    }
  })

  return {
    provide: {
      supabase
    }
  }
})
