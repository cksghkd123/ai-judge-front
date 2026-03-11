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

        <!-- pending -->
        <div v-if="routeStatus === 'pending'" class="border-2 border-ink rounded-lg p-4">
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

        <!-- active -->
        <template v-if="routeStatus === 'active'">
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

        <!-- rebutting -->
        <template v-if="routeStatus === 'rebutting'">
          <div class="border-2 border-ink rounded-lg p-4 flex flex-col gap-3">
            <h2 class="font-ui font-semibold text-sm m-0">상대방 증거 반박</h2>
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
                      :checked="getRebuttal(e.id).accepted"
                      type="radio"
                      :name="`rev-${e.id}`"
                      :value="true"
                      @change="setRebuttalAccepted(e.id, true)"
                    />
                    <span class="text-sm">인정 (YES)</span>
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input
                      :checked="!getRebuttal(e.id).accepted"
                      type="radio"
                      :name="`rev-${e.id}`"
                      :value="false"
                      @change="setRebuttalAccepted(e.id, false)"
                    />
                    <span class="text-sm">불인정 (NO)</span>
                  </label>
                </div>
                <div v-if="!getRebuttal(e.id).accepted" class="mt-2">
                  <label class="font-ui text-xs font-semibold">반박 내용 (필수)</label>
                  <textarea
                    :value="getRebuttal(e.id).rebuttal"
                    rows="2"
                    class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none resize-y mt-1"
                    placeholder="불인정 사유를 적어 주세요."
                    @input="setRebuttalText(e.id, ($event.target as HTMLTextAreaElement).value)"
                  />
                </div>
              </li>
            </ul>
            <template v-if="!myRebuttalComplete">
              <button
                type="button"
                class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:transform-none w-fit"
                :disabled="!canSubmitRebuttal || submitting"
                @click="submitRebuttal"
              >
                {{ submitting ? '처리 중...' : '반박 제출' }}
              </button>
            </template>
            <template v-else>
              <p class="m-0 text-accent font-doodle text-sm">반박 제출 완료</p>
            </template>
          </div>
        </template>

        <!-- judging -->
        <div v-if="routeStatus === 'judging'" class="border-2 border-ink rounded-lg p-4">
          <p class="m-0 text-ink/80">AI 판사가 판결서를 작성하고 있어요. 잠시만 기다려 주세요.</p>
          <NuxtLink
            :to="`/case/${caseId}/wait`"
            class="inline-block mt-2 border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-accent shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
          >
            판결 대기 화면으로
          </NuxtLink>
        </div>

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

const VALID_STATUSES = ['pending', 'active', 'rebutting', 'judging'] as const
type RouteStatus = (typeof VALID_STATUSES)[number]

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const caseId = route.params.id as string
const routeStatus = computed(() => route.params.status as string)

const {
  getCase,
  addEvidence: addEvidenceStore,
  removeEvidence: removeEvidenceStore,
  setEvidenceComplete,
  setRebuttal,
  setRebuttalComplete,
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

// URL 상태와 실제 사건 상태가 다르면 올바른 URL로 리다이렉트
watch(
  [caseData, routeStatus],
  ([data, status]) => {
    const s = (status || '') as string
    if (!VALID_STATUSES.includes(s as RouteStatus)) {
      if (data) {
        const actual = data.status
        if (actual === 'completed') router.replace(`/case/${caseId}/verdict`)
        else router.replace(`/case/${caseId}/${actual}`)
      } else {
        router.replace(`/case/${caseId}`)
      }
      return
    }
    if (!data) return
    const actual = data.status
    if (actual === 'completed') {
      router.replace(`/case/${caseId}/verdict`)
      return
    }
    if (actual !== s) {
      router.replace(`/case/${caseId}/${actual}`)
    }
  },
  { immediate: true },
)

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
    rebutting: '반박 작성 중',
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

const myRebuttalComplete = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'plaintiff'
    ? caseData.value.plaintiffRebuttalComplete
    : caseData.value.defendantRebuttalComplete
})

const myRebuttals = computed(() => {
  if (!caseData.value || !myRole.value) return {}
  return myRole.value === 'plaintiff'
    ? caseData.value.plaintiffRebuttals
    : caseData.value.defendantRebuttals
})

const rebuttals = ref<Record<string, { accepted: boolean; rebuttal?: string }>>({})

watch(
  () => [caseData.value?.id, opponentEvidenceList.value],
  () => {
    const next: Record<string, { accepted: boolean; rebuttal?: string }> = {}
    for (const e of opponentEvidenceList.value) {
      const existing = myRebuttals.value[e.id]
      next[e.id] = existing
        ? { accepted: existing.accepted, rebuttal: existing.rebuttal ?? '' }
        : { accepted: true, rebuttal: '' }
    }
    rebuttals.value = next
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
  return Boolean(newEvidenceFile.value)
})

async function addEvidence() {
  if (!caseData.value || !myRole.value) return
  if (newEvidenceType.value === 'text') {
    if (!newEvidenceContent.value.trim()) return
  } else {
    if (!newEvidenceFile.value) return
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

function onEvidenceFileSelect(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  newEvidenceFile.value = file
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

function getRebuttal(evidenceId: string): { accepted: boolean; rebuttal?: string } {
  return rebuttals.value[evidenceId] ?? { accepted: true, rebuttal: '' }
}

function setRebuttalAccepted(evidenceId: string, accepted: boolean) {
  if (!rebuttals.value[evidenceId]) rebuttals.value[evidenceId] = { accepted: true, rebuttal: '' }
  rebuttals.value[evidenceId].accepted = accepted
}

function setRebuttalText(evidenceId: string, rebuttal: string) {
  if (!rebuttals.value[evidenceId]) rebuttals.value[evidenceId] = { accepted: false, rebuttal: '' }
  rebuttals.value[evidenceId].rebuttal = rebuttal
}

const canSubmitRebuttal = computed(() => {
  if (opponentEvidenceList.value.length === 0) return true
  for (const e of opponentEvidenceList.value) {
    const r = rebuttals.value[e.id]
    if (!r) return false
    if (r.accepted === false && (!r.rebuttal || !r.rebuttal.trim())) return false
  }
  return true
})

async function submitRebuttal() {
  if (!caseData.value || !myRole.value) return
  submitting.value = true
  try {
    for (const e of opponentEvidenceList.value) {
      const r = rebuttals.value[e.id]
      if (r) {
        await setRebuttal(caseId, myRole.value as EvidenceSubmittedBy, e.id, {
          accepted: r.accepted,
          rebuttal: r.rebuttal?.trim(),
        })
      }
    }
    await setRebuttalComplete(caseId, myRole.value as EvidenceSubmittedBy)
  } finally {
    submitting.value = false
  }
}
</script>
