<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <section class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
      <p class="m-0 text-ink/80">참여하려면 내용증명 전달 시 받은 링크(토큰 포함)로 들어와 주세요.</p>
      <NuxtLink
        to="/dashboard"
        class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard text-center no-underline"
      >
        대시보드로
      </NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const caseId = route.params.id as string
const token = route.query.token as string | undefined

onMounted(() => {
  if (token) {
    router.replace({ path: `/case/${caseId}/invited`, query: { token } })
  }
})
</script>
