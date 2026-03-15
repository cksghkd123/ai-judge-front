<template>
  <main class="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-ink font-body">
    <section class="w-full max-w-md flex flex-col gap-6 border-4 border-ink bg-paper p-8 rounded-lg shadow-hard text-center">
      <h1 class="font-doodle text-2xl font-bold m-0">AI 판사가 판결서를 작성하고 있어요...</h1>
      <div class="flex justify-center gap-2">
        <span
          v-for="i in 3"
          :key="i"
          class="w-3 h-3 rounded-full bg-primary border-2 border-ink animate-bounce"
          :style="{ animationDelay: `${(i - 1) * 0.15 }s` }"
        />
      </div>
      <p class="m-0 text-sm text-ink/70">잠시만 기다려 주세요.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const caseId = route.params.id as string
const { getCase, isApiMode, fetchCaseFromApi } = useCaseStore()

const caseData = computed(() => getCase(caseId))
const api = useCaseApi()

onMounted(() => {
  if (!caseData.value) {
    router.replace('/dashboard')
    return
  }

  if (!isApiMode()) {
    return
  }

  const intervalMs = 3000
  const t = setInterval(async () => {
    try {
      const detail = await api.getCaseDetail(caseId)
      if (detail.status === 'completed') {
        clearInterval(t)
        await fetchCaseFromApi(caseId)
        router.replace(`/case/${caseId}/verdict`)
      }
    } catch {
      // ignore, keep polling
    }
  }, intervalMs)

  onUnmounted(() => clearInterval(t))
})
</script>
