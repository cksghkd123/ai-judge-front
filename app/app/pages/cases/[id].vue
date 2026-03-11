<template>
  <main class="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-ink font-body">
    <p class="m-0 text-ink/80">이동 중...</p>
  </main>
</template>

<script setup lang="ts">
// 예전 URL 호환: /cases/[id]?token=xxx → /case/[id]/invited?token=xxx 로 리다이렉트
definePageMeta({})

const route = useRoute()

onMounted(() => {
  const id = route.params.id as string
  const query = { ...route.query }
  navigateTo({ path: `/case/${id}/invited`, query }, { replace: true })
})
</script>
