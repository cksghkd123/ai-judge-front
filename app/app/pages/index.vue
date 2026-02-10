<template>
  <main class="min-h-screen flex items-center justify-center p-6 bg-paper text-ink font-body">
    <section class="w-full max-w-md text-center flex flex-col gap-4">
      <h1 class="font-heading font-extrabold tracking-tight text-3xl m-0">땅땅땅</h1>
      <h2 class="font-doodle text-xl m-0 text-ink/80">AI 판사</h2>
      <p class="font-body text-ink/70 m-0">딱. 정해드립니다.</p>
      <NuxtLink
        to="/sign-in"
        class="font-ui font-semibold inline-block mt-2 py-3 px-6 rounded-lg border-2 border-ink bg-ink text-paper shadow-hard no-underline transition duration-150 ease-out hover:-translate-y-1"
      >
        시작하기
      </NuxtLink>
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
