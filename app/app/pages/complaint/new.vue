<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <section class="w-full max-w-md flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
      <h1 class="font-doodle text-2xl font-bold tracking-tight m-0">고소장 작성</h1>
      <p class="m-0 text-ink/80 text-sm">사건을 한 줄로 요약하고, 상대와 고소 내용을 적어주세요.</p>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-1">
          <label for="title" class="font-ui text-sm font-semibold">제목 (사건 개요 한 줄)</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 focus:border-ink outline-none transition duration-150"
            placeholder="예: 차량 접촉 사고 과실 논란"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="opponent" class="font-ui text-sm font-semibold">상대 식별 (이메일 등)</label>
          <input
            id="opponent"
            v-model="form.opponentIdentifier"
            type="text"
            class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 focus:border-ink outline-none transition duration-150"
            placeholder="나중에 초대 링크로 보낼 예정이에요"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="body" class="font-ui text-sm font-semibold">고소 내용</label>
          <textarea
            id="body"
            v-model="form.complaintSummary"
            required
            rows="6"
            class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 focus:border-ink outline-none resize-y transition duration-150"
            placeholder="무슨 일로 고소하는지 구체적으로 적어주세요."
          />
        </div>
        <button
          type="submit"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          :disabled="submitting"
        >
          {{ submitting ? '제출 중...' : '고소장 제출' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { createCase } = useCaseStore()
const { user } = useAuth()
const router = useRouter()

const form = reactive({
  title: '',
  opponentIdentifier: '',
  complaintSummary: '',
})

const submitting = ref(false)

const onSubmit = () => {
  if (!user.value?.id) return
  submitting.value = true
  try {
    const caseData = createCase({
      title: form.title,
      complaintSummary: form.complaintSummary,
      plaintiffId: user.value.id,
      opponentIdentifier: form.opponentIdentifier || undefined,
    })
    router.push(`/case/${caseData.id}/invite`)
  } finally {
    submitting.value = false
  }
}
</script>
