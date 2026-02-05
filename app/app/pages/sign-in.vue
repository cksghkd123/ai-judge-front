<template>
  <main class="page">
    <section class="card">
      <header class="header">
        <p class="eyebrow">AI 판사</p>
        <h1 class="title">로그인</h1>
        <p class="subtitle">카카오나 구글로 10초 만에 시작하세요.</p>
      </header>

      <div class="buttons">
        <button class="btn btn-kakao" :disabled="loading || !isConfigured" @click="signIn('kakao')">
          카카오로 로그인
        </button>
        <button
          class="btn btn-google"
          :disabled="loading || !isConfigured"
          @click="signIn('google')"
        >
          구글로 로그인
        </button>
      </div>

      <p v-if="loading" class="status">로그인 중...</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="session && !loading" class="status">이미 로그인되어 있어요. 이동 중...</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Provider } from '@supabase/supabase-js'

const supabase = useNuxtApp().$supabase
const { session, isReady } = useAuth()
const isConfigured = computed(() => Boolean(supabase))
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')

const signIn = async (provider: Provider) => {
  errorMessage.value = ''
  loading.value = true

  if (!supabase) {
    errorMessage.value = 'Supabase 환경변수가 설정되지 않았어요.'
    loading.value = false
    return
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + '/sign-in',
    },
  })

  if (error) {
    errorMessage.value = error.message || '로그인에 실패했어요. 잠시 후 다시 시도해주세요.'
    loading.value = false
  }
}

// OAuth 콜백: URL에 code가 있으면 세션으로 교환 후 홈으로
onMounted(async () => {
  if (!supabase) {
    errorMessage.value = 'Supabase 환경변수가 설정되지 않았어요.'
    return
  }

  const code = route.query.code as string | undefined

  if (code) {
    loading.value = true
    const { data: exchangeData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)
    loading.value = false
    if (exchangeError) {
      errorMessage.value =
        exchangeError.message || '로그인 처리에 실패했어요. 잠시 후 다시 시도해주세요.'
      await router.replace({ path: '/sign-in', query: {} })
      return
    }
    if (exchangeData.session) {
      await router.replace('/')
    }
    return
  }
})

watch([isReady, session], ([ready, sess]) => {
  if (ready && sess && !route.query.code) {
    router.replace('/')
  }
})
</script>

<style scoped>
:global(body) {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  background: #f7f7f9;
  color: #111;
}

.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 10px 30px rgba(17, 17, 17, 0.08);
  display: grid;
  gap: 20px;
}

.header {
  display: grid;
  gap: 8px;
  text-align: center;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6b7280;
  margin: 0;
}

.title {
  margin: 0;
  font-size: 26px;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.buttons {
  display: grid;
  gap: 12px;
}

.btn {
  border: none;
  border-radius: 12px;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.06s ease,
    box-shadow 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:active {
  transform: translateY(1px);
}

.btn-kakao {
  background: #fee500;
  color: #191919;
}

.btn-google {
  background: #fff;
  color: #111;
  border: 1px solid #e5e7eb;
}

.status {
  text-align: center;
  margin: 0;
  color: #374151;
  font-size: 14px;
}

.error {
  text-align: center;
  margin: 0;
  color: #dc2626;
  font-size: 14px;
}

@media (min-width: 960px) {
  .card {
    max-width: 480px;
    padding: 32px 28px;
  }
}
</style>
