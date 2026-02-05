<template>
  <main class="page">
    <section class="card">
      <h1 class="title">AI 판사</h1>
      <p class="subtitle">환영해요, {{ user?.user_metadata?.full_name ?? user?.email ?? '판사님' }}!</p>
      <p class="desc">로그인에 성공했어요. 이제 재판을 시작할 수 있어요.</p>
      <button type="button" class="btn" :disabled="loggingOut" @click="handleSignOut">
        {{ loggingOut ? '로그아웃 중...' : '로그아웃' }}
      </button>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, signOut } = useAuth()
const router = useRouter()
const loggingOut = ref(false)

const handleSignOut = async () => {
  loggingOut.value = true
  try {
    await signOut()
    await router.replace('/sign-in')
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f7f7f9;
  color: #111;
}

.card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow: 0 10px 30px rgba(17, 17, 17, 0.08);
  text-align: center;
  display: grid;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 22px;
}

.subtitle {
  margin: 0;
  color: #111;
  font-size: 16px;
  font-weight: 600;
}

.desc {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.btn {
  margin-top: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #374151;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  opacity: 0.9;
}
</style>
