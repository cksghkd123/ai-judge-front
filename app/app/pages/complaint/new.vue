<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <section
      class="w-full max-w-md flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
    >
      <h1 class="font-doodle text-2xl font-bold tracking-tight m-0">내용증명 작성</h1>
      <p class="m-0 text-ink/80 text-sm">
        상대에게 전달할 내용증명을 작성해 주세요. <br />
        제목, 설명, 논점을 적고 상대에게 공유 링크를 보낼 수 있어요.
      </p>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-1">
          <label for="title" class="font-ui text-sm font-semibold">사건 제목</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 focus:border-ink outline-none transition duration-150"
            placeholder="예: 시간 약속 무시 사건"
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
            placeholder="내용증명에 담을 상황 설명을 적어주세요."
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
            placeholder="예: 약속에 늦을만 했는가"
          />
        </div>
        <div v-if="agents.length > 0" class="flex flex-col gap-2">
          <p class="font-ui text-sm font-semibold m-0">판사 선택</p>
          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              class="border-2 border-ink rounded-full w-8 h-8 flex items-center justify-center bg-paper shadow-hard transition duration-150 ease-out hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="agents.length <= 1"
              @click="prevJudge"
            >
              ‹
            </button>
            <div v-if="currentJudge" class="flex-1 flex flex-col items-center">
              <div
                class="w-64 h-64 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0 bg-ink/5"
              >
                <img
                  v-if="currentJudge.judge_image"
                  :src="currentJudge.judge_image"
                  :alt="currentJudge.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="font-doodle text-2xl text-ink/80" aria-hidden="true">⚖</span>
              </div>
              <span class="font-doodle block text-base leading-tight mt-2">
                {{ currentJudge.name }}
              </span>
            </div>
            <button
              type="button"
              class="border-2 border-ink rounded-full w-8 h-8 flex items-center justify-center bg-paper shadow-hard transition duration-150 ease-out hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="agents.length <= 1"
              @click="nextJudge"
            >
              ›
            </button>
          </div>
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

const { createCase, isApiMode } = useCaseStore()
const { user } = useAuth()
const router = useRouter()
const { getJudgeAgents } = useCaseApi()

const form = reactive({
  title: '',
  complaintSummary: '',
  issue: '',
  judgeAgentId: 'default' as string,
})

const agents = ref<Array<{ id: string; name: string; judge_image?: string }>>([])
const submitting = ref(false)

const currentJudgeIndex = computed(() => {
  if (!agents.value.length) return -1
  const idx = agents.value.findIndex((a) => a.id === form.judgeAgentId)
  return idx >= 0 ? idx : 0
})

const currentJudge = computed(() =>
  currentJudgeIndex.value >= 0 ? agents.value[currentJudgeIndex.value] : null,
)

onMounted(async () => {
  if (isApiMode()) {
    try {
      agents.value = await getJudgeAgents()
      const first = agents.value[0]
      if (first) {
        form.judgeAgentId = first.id
      }
    } catch {
      agents.value = []
    }
  }
})

const nextJudge = () => {
  if (!agents.value.length) return
  const idx = currentJudgeIndex.value
  const next = (idx + 1) % agents.value.length
  const target = agents.value[next]
  if (!target) return
  form.judgeAgentId = target.id
}

const prevJudge = () => {
  if (!agents.value.length) return
  const idx = currentJudgeIndex.value
  const prev = (idx - 1 + agents.value.length) % agents.value.length
  const target = agents.value[prev]
  if (!target) return
  form.judgeAgentId = target.id
}

function getClaimantProfileFromUser(): {
  claimantName?: string
  claimantAddress?: string
  claimantJobs?: string[]
  claimantProfileImage?: string
} {
  const u = user.value
  if (!u?.user_metadata) return {}
  const meta = u.user_metadata as Record<string, unknown>
  const name = (meta.full_name as string) || (meta.name as string) || ''
  const address = (meta.address as string) || ''
  const jobRaw = meta.job
  const jobs: string[] = Array.isArray(jobRaw)
    ? (jobRaw as string[]).map((j) => String(j).trim()).filter(Boolean)
    : typeof jobRaw === 'string' && jobRaw.trim()
      ? jobRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  const profileImage =
    (meta.profile_image as string) || (meta.avatar_url as string) || (meta.picture as string) || ''
  return {
    claimantName: name || undefined,
    claimantAddress: address || undefined,
    claimantJobs: jobs.length ? jobs : undefined,
    claimantProfileImage: profileImage || undefined,
  }
}

const onSubmit = async () => {
  const uid = user.value?.id
  if (!uid) return
  submitting.value = true
  try {
    const profile = getClaimantProfileFromUser()
    const caseData = await createCase({
      title: form.title,
      complaintSummary: form.complaintSummary,
      issue: form.issue.trim() || '논점 미기재',
      claimantId: uid,
      judgeAgentId: isApiMode() ? form.judgeAgentId || undefined : undefined,
      ...profile,
    })
    router.push(`/case/${caseData.id}/invite`)
  } finally {
    submitting.value = false
  }
}
</script>
