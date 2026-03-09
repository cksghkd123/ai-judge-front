// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app/',
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      'Nanum Myeongjo': { wght: [400, 700, 800] },
      'Nanum Pen Script': true,
      Jua: true,
      'Gowun Dodum': true,
      Roboto: { wght: [500] }, // Google 로그인 버튼 가이드라인 (Roboto Medium)
    },
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabasePublishableKey: process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      supabaseStorageBucket: process.env.NUXT_PUBLIC_SUPABASE_STORAGE_BUCKET || '',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.API_BASE || ''
    }
  }
})
