<template>
  <main class="min-h-screen flex items-center justify-center p-6 font-body bg-paper text-ink">
    <section class="card">
      <header class="header">
        <p class="eyebrow font-doodle">땅땅땅</p>
        <h1 class="title font-heading font-extrabold tracking-tight">로그인</h1>
        <p class="subtitle font-body">카카오나 구글로 시작하세요.</p>
      </header>

      <!-- 카카오/구글 공식 디자인 가이드라인 준수 -->
      <div class="buttons">
        <button
          type="button"
          class="btn btn-kakao"
          :disabled="loading || !isConfigured"
          @click="signIn('kakao')"
        >
          <img
            src="https://www.svgrepo.com/show/368252/kakao.svg"
            alt=""
            width="20"
            height="20"
            class="btn-social-icon"
          />
          <span class="btn-label">카카오 로그인</span>
        </button>
        <button
          type="button"
          class="btn btn-google"
          :disabled="loading || !isConfigured"
          @click="signIn('google')"
        >
          <img
            src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
            alt=""
            width="20"
            height="20"
            class="btn-social-icon"
          />
          <span class="btn-label">구글 로그인</span>
        </button>
      </div>

      <p v-if="loading" class="status font-body">로그인 중...</p>
      <p v-if="errorMessage" class="error font-body">{{ errorMessage }}</p>
      <p v-if="session && !loading" class="status font-body">이동 중...</p>
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
      await router.replace('/dashboard')
    }
    return
  }
})

watch([isReady, session], ([ready, sess]) => {
  if (ready && sess && !route.query.code) {
    router.replace('/dashboard')
  }
})
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 420px;
  background: var(--tw-color-paper, #fffdf5);
  border: 4px solid var(--tw-color-ink, #18181b);
  border-radius: 0.5rem;
  padding: 28px 24px;
  box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 1);
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  height: 52px;
  padding: 0 20px;
  cursor: pointer;
  transition: transform 0.15s ease-out;
  font-family: 'Roboto', system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
}

.btn-social-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.btn-label {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
  line-height: inherit;
  pointer-events: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

/* 카카오: Container #FEE500, Symbol #000000, Label 85% (Kakao Design Guide) */
.btn-kakao {
  background: #fee500;
  color: rgba(0, 0, 0, 0.85);
  border: none;
  border-radius: 12px;
}

/* 구글: Light #FFFFFF, Stroke #747775 (Google Branding) */
.btn-google {
  background: #ffffff;
  color: #1f1f1f;
  border: 1px solid #747775;
  border-radius: 12px;
}

.status {
  text-align: center;
  margin: 0;
  font-size: 0.875rem;
  color: rgb(24 24 27 / 0.8);
}

.error {
  text-align: center;
  margin: 0;
  font-size: 0.875rem;
  color: #ff4757;
}

@media (min-width: 960px) {
  .card {
    max-width: 480px;
    padding: 32px 28px;
  }
}
</style>
