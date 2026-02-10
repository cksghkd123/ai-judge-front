<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <template v-if="caseData && !myRole">
      <section class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
        <p class="m-0 text-ink/80">이 사건에 참여한 당사자가 아니에요.</p>
        <NuxtLink
          to="/dashboard"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard text-center no-underline"
        >
          대시보드로
        </NuxtLink>
      </section>
    </template>
    <template v-else-if="caseData && myRole">
      <section class="w-full max-w-lg flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
        <h1 class="font-heading font-extrabold tracking-tight text-xl m-0">{{ caseData.title }}</h1>
        <p class="m-0 text-sm text-ink/80">
          <span class="font-doodle">상태</span> {{ statusLabel }}
        </p>

        <!-- 내 제출: 폼 또는 완료 -->
        <div class="border-2 border-ink rounded-lg p-4 flex flex-col gap-3">
          <h2 class="font-ui font-semibold text-sm m-0">
            {{ myRole === 'plaintiff' ? '원고' : '피고' }} 의견·증거 (나)
          </h2>
          <template v-if="hasISubmitted">
            <p class="m-0 text-ink/90 text-sm whitespace-pre-wrap">{{ mySubmissionText }}</p>
            <p class="m-0 text-accent font-doodle text-sm">제출 완료</p>
          </template>
          <template v-else>
            <textarea
              v-model="submissionText"
              rows="4"
              class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 focus:border-ink outline-none resize-y"
              placeholder="의견과 증거를 적어주세요."
            />
            <button
              type="button"
              class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:transform-none w-fit"
              :disabled="!submissionText.trim() || submitting"
              @click="submitMyOpinion"
            >
              {{ submitting ? '제출 중...' : '제출' }}
            </button>
          </template>
        </div>

        <!-- 상대 제출 여부 -->
        <div class="border-2 border-ink rounded-lg p-4">
          <h2 class="font-ui font-semibold text-sm m-0">
            {{ myRole === 'plaintiff' ? '피고' : '원고' }} 제출 여부
          </h2>
          <p class="m-0 text-sm text-ink/80 mt-2">
            {{ otherSubmitted ? '상대방 제출 완료' : '상대방 제출 대기 중' }}
          </p>
        </div>

        <!-- 둘 다 제출 시 판결 받기 -->
        <NuxtLink
          v-if="caseData.status === 'both_submitted'"
          :to="`/case/${caseId}/wait`"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-accent shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          판결 받기
        </NuxtLink>

        <NuxtLink
          :to="'/dashboard'"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-paper text-ink shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          대시보드로
        </NuxtLink>
      </section>
    </template>
    <section v-else class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
      <p class="m-0 text-ink/80">해당 사건을 찾을 수 없어요.</p>
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
const caseId = route.params.id as string
const { getCase, updateCase } = useCaseStore()
const { user } = useAuth()

const caseData = computed(() => getCase(caseId))

type Role = 'plaintiff' | 'defendant' | null
const myRole = computed<Role>(() => {
  if (!caseData.value || !user.value?.id) return null
  if (caseData.value.plaintiffId === user.value.id) return 'plaintiff'
  if (caseData.value.defendantId === user.value.id) return 'defendant'
  return null
})

const hasISubmitted = computed(() => {
  if (!caseData.value || !myRole.value) return false
  if (myRole.value === 'plaintiff') return Boolean(caseData.value.plaintiffSubmission)
  return Boolean(caseData.value.defendantSubmission)
})

const mySubmissionText = computed(() => {
  if (!caseData.value || !myRole.value) return ''
  return myRole.value === 'plaintiff'
    ? (caseData.value.plaintiffSubmission ?? '')
    : (caseData.value.defendantSubmission ?? '')
})

const otherSubmitted = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'plaintiff'
    ? Boolean(caseData.value.defendantSubmission)
    : Boolean(caseData.value.plaintiffSubmission)
})

const statusLabel = computed(() => {
  const s = caseData.value?.status
  if (!s) return ''
  const map: Record<string, string> = {
    invite: '초대 대기 중',
    matched: '매칭됨',
    plaintiff_submitted: '원고 제출 완료, 피고 제출 대기',
    defendant_submitted: '피고 제출 완료, 원고 제출 대기',
    both_submitted: '둘 다 제출 완료',
    judging: '판결 중',
    verdict: '판결 완료',
  }
  return map[s] ?? s
})

const submissionText = ref('')
const submitting = ref(false)

function submitMyOpinion() {
  if (!caseData.value || !myRole.value || !submissionText.value.trim()) return
  submitting.value = true
  const text = submissionText.value.trim()
  const nextStatus =
    myRole.value === 'plaintiff'
      ? caseData.value.defendantSubmission
        ? 'both_submitted'
        : 'plaintiff_submitted'
      : caseData.value.plaintiffSubmission
        ? 'both_submitted'
        : 'defendant_submitted'

  updateCase(caseId, {
    ...(myRole.value === 'plaintiff'
      ? { plaintiffSubmission: text }
      : { defendantSubmission: text }),
    status: nextStatus,
  })
  submitting.value = false
  submissionText.value = ''
}
</script>
