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
const { getCase, updateCase } = useCaseStore()

const caseData = computed(() => getCase(caseId))

onMounted(() => {
  if (!caseData.value) {
    router.replace('/dashboard')
    return
  }
  updateCase(caseId, { status: 'judging' })

  const delay = 2500
  const t = setTimeout(() => {
    updateCase(caseId, {
      status: 'completed',
      verdictText:
        '원고와 피고의 주장을 검토한 결과, 본 재판소는 다음과 같이 판단한다.\n\n' +
        '1. 원고의 주장 요지: 고소장 및 제출 의견에 기재된 바와 같다.\n' +
        '2. 피고의 주장 요지: 제출 의견에 기재된 바와 같다.\n\n' +
        '3. 판단: 쌍방에게 모두 일정한 과실이 인정되나, 그 비율을 4 대 6으로 보는 것이 타당하다.\n\n' +
        '4. 결론: 원고 40, 피고 60의 과실 비율로 본건을 종결한다.',
      faultRatio: { plaintiff: 40, defendant: 60 },
    })
    router.replace(`/case/${caseId}/verdict`)
  }, delay)
  onUnmounted(() => clearTimeout(t))
})
</script>

