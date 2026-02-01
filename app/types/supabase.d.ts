import type { SupabaseClient } from '@supabase/supabase-js'

declare module 'nuxt/app' {
  interface NuxtApp {
    $supabase: SupabaseClient
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient
  }
}
