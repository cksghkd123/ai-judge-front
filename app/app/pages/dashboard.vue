<template>
  <main class="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-ink font-body">
    <section class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
      <h1 class="font-heading font-extrabold tracking-tight text-2xl m-0">대시보드</h1>
      <p class="m-0 text-ink/80">
        환영해요, {{ user?.user_metadata?.full_name ?? user?.email ?? '판사님' }}!
      </p>
      <div class="flex flex-col gap-2">
        <NuxtLink
          to="/complaint/new"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          고소하기
        </NuxtLink>
        <NuxtLink
          to="/profile"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-blue-pen text-paper shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          내 정보
        </NuxtLink>
        <button
          type="button"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-ink text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          :disabled="loggingOut"
          @click="handleSignOut"
        >
          {{ loggingOut ? '로그아웃 중...' : '로그아웃' }}
        </button>
      </div>
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

