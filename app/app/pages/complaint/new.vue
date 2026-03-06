<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <section class="w-full max-w-md flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
      <h1 class="font-doodle text-2xl font-bold tracking-tight m-0">내용증명 작성</h1>
      <p class="m-0 text-ink/80 text-sm">
        상대에게 전달할 내용증명을 작성해 주세요. 제목, 설명, 논점을 적으면 이후 상대에게 공유 링크를 보낼 수 있어요.
      </p>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-1">
          <label for="title" class="font-ui text-sm font-semibold">제목 (한 줄 요약)</label>
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
          <label for="body" class="font-ui text-sm font-semibold">내용 (설명)</label>
          <textarea
            id="body"
            v-model="form.complaintSummary"
            required
            rows="5"
            class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 focus:border-ink outline-none resize-y transition duration-150"
            placeholder="내용증명에 담을 설명을 구체적으로 적어주세요."
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="issue" class="font-ui text-sm font-semibold">논점</label>
          <input
            id="issue"
            v-model="form.issue"
            type="text"
            required
            class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 focus:border-ink outline-none transition duration-150"
            placeholder="예: 접촉 사고 시 과실 비율"
          />
        </div>
        <button
          type="submit"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          :disabled="submitting"
        >
          {{ submitting ? '처리 중...' : '다음: 공유 링크 받기' }}
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
  complaintSummary: '',
  issue: '',
})

const submitting = ref(false)

const onSubmit = () => {
  if (!user.value?.id) return
  submitting.value = true
  try {
    const caseData = createCase({
      title: form.title,
      complaintSummary: form.complaintSummary,
      issue: form.issue.trim() || '논점 미기재',
      plaintiffId: user.value.id,
    })
    router.push(`/case/${caseData.id}/invite`)
  } finally {
    submitting.value = false
  }
}
</script>
