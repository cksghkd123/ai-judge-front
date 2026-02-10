<template>
  <main class="page">
    <section class="card">
      <h1 class="title">땅땅땅</h1>
      <h3 class="subtitle">AI 판사</h3>
      <p class="tagline">딱. 정해드립니다.</p>
      <NuxtLink class="btn" to="/sign-in">시작하기</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
const { isLoggedIn } = useAuth()
const router = useRouter()

// 로그인된 상태로 / 접속 시 대시보드로
watch(
  isLoggedIn,
  (loggedIn) => {
    if (loggedIn) router.replace('/dashboard')
  },
  { immediate: true },
)
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
  font-size: 28px;
  font-weight: 700;
}

.tagline {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.btn {
  display: inline-block;
  margin-top: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #18181b;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.btn:hover {
  opacity: 0.9;
}
</style>
