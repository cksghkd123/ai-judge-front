<template>
  <main class="page">
    <section class="card">
      <h1 class="title">대시보드</h1>
      <p class="welcome">환영해요, {{ user?.user_metadata?.full_name ?? user?.email ?? '판사님' }}!</p>
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
    await router.replace('/')
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
  max-width: 400px;
  text-align: center;
  display: grid;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.welcome {
  margin: 0;
  font-size: 15px;
  color: #374151;
}

.btn {
  margin-top: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #18181b;
  border: none;
  border-radius: 10px;
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
