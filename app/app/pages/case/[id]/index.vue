<template>
  <main class="min-h-screen flex flex-col items-center p-6 pb-12 bg-paper text-ink font-body">
    <template v-if="caseData && !myRole">
      <section
        class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
      >
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
      <section
        class="w-full max-w-lg flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
      >
        <h1 class="font-heading font-extrabold tracking-tight text-xl m-0">{{ caseData.title }}</h1>
        <p class="m-0 text-sm text-ink/80">
          <span class="font-doodle">상태</span> {{ statusLabel }}
        </p>
        <p v-if="caseData.issue" class="m-0 text-sm text-ink/70">논점: {{ caseData.issue }}</p>

        <!-- pending: 상대 참여 대기 (원고만) -->
        <div v-if="caseData.status === 'pending'" class="border-2 border-ink rounded-lg p-4">
          <p class="m-0 text-ink/80">
            상대방이 참여할 때까지 기다리는 중이에요. 내용증명 전달용 링크를 보냈는지 확인해 주세요.
          </p>
          <NuxtLink
            :to="`/case/${caseId}/invite`"
            class="inline-block mt-2 border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-accent shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
          >
            공유 링크 다시 보기
          </NuxtLink>
        </div>

        <!-- active: 내 증거 제출 (다건 + 타입) + 제출 완료 -->
        <template v-if="caseData.status === 'active'">
          <div class="border-2 border-ink rounded-lg p-4 flex flex-col gap-3">
            <h2 class="font-ui font-semibold text-sm m-0">
              {{ myRole === 'plaintiff' ? '원고' : '피고' }} 증거 (나)
            </h2>
            <template v-if="myEvidenceComplete">
              <ul class="list-none m-0 p-0 flex flex-col gap-2">
                <li
                  v-for="e in myEvidenceList"
                  :key="e.id"
                  class="border-2 border-ink rounded-lg p-3 flex flex-col gap-1"
                >
                  <span class="font-ui text-xs text-ink/70">{{ evidenceTypeLabel(e.type) }}</span>
                  <p v-if="e.type === 'text'" class="m-0 text-sm whitespace-pre-wrap">
                    {{ e.content }}
                  </p>
                  <template v-else>
                    <img
                      v-if="e.file_path"
                      :src="getEvidenceImageUrl(e.file_path)"
                      alt="첨부"
                      class="max-w-full max-h-40 object-contain rounded border border-ink"
                    />
                    <p v-if="e.content" class="m-0 text-sm text-ink/80">{{ e.content }}</p>
                  </template>
                </li>
              </ul>
              <p class="m-0 text-accent font-doodle text-sm">내 쪽 제출 완료</p>
            </template>
            <template v-else>
              <ul class="list-none m-0 p-0 flex flex-col gap-2">
                <li
                  v-for="e in myEvidenceList"
                  :key="e.id"
                  class="border-2 border-ink rounded-lg p-3 flex flex-col gap-1"
                >
                  <span class="font-ui text-xs text-ink/70">{{ evidenceTypeLabel(e.type) }}</span>
                  <p v-if="e.type === 'text'" class="m-0 text-sm whitespace-pre-wrap">
                    {{ e.content }}
                  </p>
                  <template v-else>
                    <img
                      v-if="e.file_path"
                      :src="getEvidenceImageUrl(e.file_path)"
                      alt="첨부"
                      class="max-w-full max-h-40 object-contain rounded border border-ink"
                    />
                    <p v-if="e.content" class="m-0 text-sm text-ink/80">{{ e.content }}</p>
                  </template>
                  <button
                    type="button"
                    class="w-fit text-sm border border-ink rounded px-2 py-1 font-ui opacity-70 hover:opacity-100 transition duration-150"
                    @click="removeEvidence(e.id)"
                  >
                    삭제
                  </button>
                </li>
              </ul>
              <!-- 증거 추가 -->
              <div class="border-2 border-dashed border-ink rounded-lg p-3 flex flex-col gap-2">
                <p class="m-0 font-ui text-sm font-semibold">증거 추가</p>
                <select
                  v-model="newEvidenceType"
                  class="border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none"
                >
                  <option value="text">텍스트</option>
                  <option value="chat">채팅 캡처</option>
                  <option value="photo">사진/캡처</option>
                </select>
                <template v-if="newEvidenceType === 'text'">
                  <textarea
                    v-model="newEvidenceContent"
                    rows="3"
                    class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none resize-y"
                    placeholder="내용 입력"
                  />
                </template>
                <template v-else>
                  <input
                    type="url"
                    v-model="newEvidenceContent"
                    class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none"
                    placeholder="이미지 URL (또는 아래에서 파일 선택)"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    class="text-sm"
                    @change="onEvidenceFileSelect"
                  />
                  <input
                    v-model="newEvidenceDescription"
                    type="text"
                    class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none"
                    placeholder="설명 (선택)"
                  />
                </template>
                <button
                  type="button"
                  class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-blue-pen text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 w-fit disabled:opacity-60 disabled:transform-none"
                  :disabled="!canAddEvidence"
                  @click="addEvidence"
                >
                  추가
                </button>
              </div>
              <button
                type="button"
                class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:transform-none w-fit"
                :disabled="myEvidenceList.length === 0 || submitting"
                @click="submitEvidenceComplete"
              >
                {{ submitting ? '처리 중...' : '내 쪽 제출 완료' }}
              </button>
            </template>
          </div>
          <div class="border-2 border-ink rounded-lg p-4">
            <h2 class="font-ui font-semibold text-sm m-0">
              {{ myRole === 'plaintiff' ? '피고' : '원고' }} 제출 여부
            </h2>
            <p class="m-0 text-sm text-ink/80 mt-2">
              {{ otherEvidenceComplete ? '상대방 제출 완료' : (myEvidenceComplete ? '상대를 기다리고 있습니다.' : '상대방 제출 대기 중') }}
            </p>
          </div>
        </template>

        <!-- reviewing: 상대 증거 검토 YES/NO + 반박 -->
        <template v-if="caseData.status === 'reviewing'">
          <div class="border-2 border-ink rounded-lg p-4 flex flex-col gap-3">
            <h2 class="font-ui font-semibold text-sm m-0">상대방 증거 검토</h2>
            <p class="m-0 text-sm text-ink/80">
              각 증거에 대해 인정(YES) 또는 불인정(NO, 반박 필수)을 선택해 주세요.
            </p>
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="e in opponentEvidenceList"
                :key="e.id"
                class="border-2 border-ink rounded-lg p-3"
              >
                <span class="font-ui text-xs text-ink/70">{{ evidenceTypeLabel(e.type) }}</span>
                <p v-if="e.type === 'text'" class="m-0 text-sm whitespace-pre-wrap mt-1">
                  {{ e.content }}
                </p>
                <template v-else>
                  <img
                    v-if="e.file_path"
                    :src="getEvidenceImageUrl(e.file_path)"
                    alt="첨부"
                    class="max-w-full max-h-40 object-contain rounded border border-ink mt-1"
                  />
                  <p v-if="e.content" class="m-0 text-sm text-ink/80 mt-1">
                    {{ e.content }}
                  </p>
                </template>
                <div class="mt-2 flex gap-2 items-start">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input
                      :checked="getReview(e.id).accepted"
                      type="radio"
                      :name="`rev-${e.id}`"
                      :value="true"
                      @change="setReviewAccepted(e.id, true)"
                    />
                    <span class="text-sm">인정 (YES)</span>
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input
                      :checked="!getReview(e.id).accepted"
                      type="radio"
                      :name="`rev-${e.id}`"
                      :value="false"
                      @change="setReviewAccepted(e.id, false)"
                    />
                    <span class="text-sm">불인정 (NO)</span>
                  </label>
                </div>
                <div v-if="!getReview(e.id).accepted" class="mt-2">
                  <label class="font-ui text-xs font-semibold">반박 내용 (필수)</label>
                  <textarea
                    :value="getReview(e.id).rebuttal"
                    rows="2"
                    class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none resize-y mt-1"
                    placeholder="불인정 사유를 적어 주세요."
                    @input="setReviewRebuttal(e.id, ($event.target as HTMLTextAreaElement).value)"
                  />
                </div>
              </li>
            </ul>
            <template v-if="!myReviewComplete">
              <button
                type="button"
                class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:transform-none w-fit"
                :disabled="!canSubmitReview || submitting"
                @click="submitReview"
              >
                {{ submitting ? '처리 중...' : '검토 제출' }}
              </button>
            </template>
            <template v-else>
              <p class="m-0 text-accent font-doodle text-sm">검토 제출 완료</p>
            </template>
          </div>
        </template>

        <!-- judging: 판결 대기 -->
        <template v-if="caseData.status === 'judging'">
          <div class="border-2 border-ink rounded-lg p-4">
            <p class="m-0 text-ink/80">AI 판사가 판결서를 작성하고 있어요. 잠시만 기다려 주세요.</p>
            <NuxtLink
              :to="`/case/${caseId}/wait`"
              class="inline-block mt-2 border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-accent shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
            >
              판결 대기 화면으로
            </NuxtLink>
          </div>
        </template>

        <!-- completed: 결과 보기 -->
        <template v-if="caseData.status === 'completed'">
          <div class="border-2 border-ink rounded-lg p-4">
            <p class="m-0 text-ink/80">이 사건의 판결이 완료되었습니다.</p>
            <NuxtLink
              :to="`/case/${caseId}/verdict`"
              class="inline-block mt-2 border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
            >
              판결문 보기
            </NuxtLink>
          </div>
        </template>

        <NuxtLink
          to="/dashboard"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-paper text-ink shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          대시보드로
        </NuxtLink>
      </section>
    </template>
    <section
      v-else
      class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
    >
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
import type { Evidence, EvidenceType, EvidenceSubmittedBy } from '~/composables/useCaseStore'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const caseId = route.params.id as string
const {
  getCase,
  addEvidence: addEvidenceStore,
  removeEvidence: removeEvidenceStore,
  setEvidenceComplete,
  setReview,
  setReviewComplete,
  isApiMode,
  fetchCaseFromApi,
} = useCaseStore()
const { user } = useAuth()
const { getEvidenceImageUrl } = useCaseApi()

await useAsyncData(
  `case-${caseId}`,
  async () => {
    if (isApiMode()) return fetchCaseFromApi(caseId)
    return null
  },
  { server: false },
)

const caseData = computed(() => getCase(caseId))

type Role = 'plaintiff' | 'defendant' | null
const myRole = computed<Role>(() => {
  if (!caseData.value || !user.value?.id) return null
  if (caseData.value.plaintiffId === user.value.id) return 'plaintiff'
  if (caseData.value.defendantId === user.value.id) return 'defendant'
  return null
})

const statusLabel = computed(() => {
  const s = caseData.value?.status
  if (!s) return ''
  const map: Record<string, string> = {
    pending: '상대 참여 대기',
    active: '증거 제출 중',
    reviewing: '상대 증거 검토 중',
    judging: '판결 중',
    completed: '판결 완료',
  }
  return map[s] ?? s
})

const myEvidenceList = computed(() => {
  if (!caseData.value || !myRole.value) return []
  return myRole.value === 'plaintiff'
    ? caseData.value.plaintiffEvidence
    : caseData.value.defendantEvidence
})

const myEvidenceComplete = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'plaintiff'
    ? caseData.value.plaintiffEvidenceComplete
    : caseData.value.defendantEvidenceComplete
})

const otherEvidenceComplete = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'plaintiff'
    ? caseData.value.defendantEvidenceComplete
    : caseData.value.plaintiffEvidenceComplete
})

const opponentEvidenceList = computed(() => {
  if (!caseData.value || !myRole.value) return []
  return myRole.value === 'plaintiff'
    ? caseData.value.defendantEvidence
    : caseData.value.plaintiffEvidence
})

const myReviewComplete = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'plaintiff'
    ? caseData.value.plaintiffReviewComplete
    : caseData.value.defendantReviewComplete
})

const myReviews = computed(() => {
  if (!caseData.value || !myRole.value) return {}
  return myRole.value === 'plaintiff'
    ? caseData.value.plaintiffReviews
    : caseData.value.defendantReviews
})

const reviews = ref<Record<string, { accepted: boolean; rebuttal?: string }>>({})

watch(
  () => [caseData.value?.id, opponentEvidenceList.value],
  () => {
    const next: Record<string, { accepted: boolean; rebuttal?: string }> = {}
    for (const e of opponentEvidenceList.value) {
      const existing = myReviews.value[e.id]
      next[e.id] = existing
        ? { accepted: existing.accepted, rebuttal: existing.rebuttal ?? '' }
        : { accepted: true, rebuttal: '' }
    }
    reviews.value = next
  },
  { immediate: true },
)

function evidenceTypeLabel(t: string): string {
  const map: Record<string, string> = { text: '텍스트', chat: '채팅 캡처', photo: '사진/캡처' }
  return map[t] ?? t
}

const newEvidenceType = ref<EvidenceType>('text')
const newEvidenceContent = ref('')
const newEvidenceDescription = ref('')
const newEvidenceFile = ref<File | null>(null)
const submitting = ref(false)

const canAddEvidence = computed(() => {
  if (newEvidenceType.value === 'text') return newEvidenceContent.value.trim().length > 0
  return newEvidenceContent.value.trim().length > 0 || Boolean(newEvidenceFile.value)
})

async function addEvidence() {
  if (!caseData.value || !myRole.value) return
  if (newEvidenceType.value === 'text') {
    if (!newEvidenceContent.value.trim()) return
  } else {
    if (!newEvidenceContent.value.trim() && !newEvidenceFile.value) return
  }
  const evidence: Evidence = {
    id: crypto.randomUUID(),
    type: newEvidenceType.value,
    content:
      newEvidenceType.value === 'text'
        ? newEvidenceContent.value.trim() || null
        : newEvidenceDescription.value.trim() || null,
    file_path: undefined,
    submittedBy: myRole.value as EvidenceSubmittedBy,
  }
  const file = newEvidenceType.value !== 'text' ? (newEvidenceFile.value ?? undefined) : undefined
  submitting.value = true
  try {
    await addEvidenceStore(caseId, evidence, file)
    newEvidenceContent.value = ''
    newEvidenceDescription.value = ''
    newEvidenceFile.value = null
  } finally {
    submitting.value = false
  }
}

function removeEvidence(evidenceId: string) {
  if (!myRole.value) return
  removeEvidenceStore(caseId, myRole.value as EvidenceSubmittedBy, evidenceId)
}

let evidenceFileInput: HTMLInputElement | null = null
function onEvidenceFileSelect(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  newEvidenceFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    newEvidenceContent.value = reader.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

async function submitEvidenceComplete() {
  if (!myRole.value) return
  submitting.value = true
  try {
    await setEvidenceComplete(caseId, myRole.value as EvidenceSubmittedBy)
  } finally {
    submitting.value = false
  }
}

function getReview(evidenceId: string): { accepted: boolean; rebuttal?: string } {
  return reviews.value[evidenceId] ?? { accepted: true, rebuttal: '' }
}

function setReviewAccepted(evidenceId: string, accepted: boolean) {
  if (!reviews.value[evidenceId]) reviews.value[evidenceId] = { accepted: true, rebuttal: '' }
  reviews.value[evidenceId].accepted = accepted
}

function setReviewRebuttal(evidenceId: string, rebuttal: string) {
  if (!reviews.value[evidenceId]) reviews.value[evidenceId] = { accepted: false, rebuttal: '' }
  reviews.value[evidenceId].rebuttal = rebuttal
}

const canSubmitReview = computed(() => {
  if (opponentEvidenceList.value.length === 0) return true
  for (const e of opponentEvidenceList.value) {
    const r = reviews.value[e.id]
    if (!r) return false
    if (r.accepted === false && (!r.rebuttal || !r.rebuttal.trim())) return false
  }
  return true
})

function submitReview() {
  if (!caseData.value || !myRole.value) return
  for (const e of opponentEvidenceList.value) {
    const r = reviews.value[e.id]
    if (r) {
      setReview(caseId, myRole.value as EvidenceSubmittedBy, e.id, {
        accepted: r.accepted,
        rebuttal: r.rebuttal?.trim(),
      })
    }
  }
  submitting.value = true
  setReviewComplete(caseId, myRole.value as EvidenceSubmittedBy)
  submitting.value = false
}
</script>
