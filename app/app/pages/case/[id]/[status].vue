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
        <p v-if="caseData.issue" class="m-0 text-sm text-ink/70">논점: {{ caseData.issue }}</p>

        <p class="m-0 text-sm text-ink/80">
          <span>{{ myRole === 'claimant' ? '청구인' : '피청구인' }} 증거 (나)</span>
        </p>
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
          <!-- 논점 밑: 제목만 노출 -->
          <div class="border-2 border-ink rounded-lg p-4 bg-paper">
            <div class="flex items-baseline justify-between gap-3">
              <h2 class="font-ui font-semibold text-sm m-0">증거 추가</h2>
              <p v-if="myEvidenceComplete" class="m-0 text-accent font-doodle text-sm">
                내 쪽 제출 완료
              </p>
            </div>

            <!-- 증거 추가 폼 (제출 완료 전만) -->
            <div v-if="!myEvidenceComplete" class="mt-3 rounded-lg p-3 flex flex-col gap-2">
              <!-- 타입 선택 (세그먼트) -->
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="border-2 border-ink rounded-lg px-3 py-2 font-ui text-sm shadow-hard transition duration-150 ease-out hover:-translate-y-1"
                  :class="newEvidenceType === 'text' ? 'bg-accent' : 'bg-paper'"
                  @click="setEvidenceType('text')"
                >
                  텍스트
                </button>
                <button
                  type="button"
                  class="border-2 border-ink rounded-lg px-3 py-2 font-ui text-sm shadow-hard transition duration-150 ease-out hover:-translate-y-1"
                  :class="newEvidenceType === 'chat' ? 'bg-accent' : 'bg-paper'"
                  @click="setEvidenceType('chat')"
                >
                  채팅 캡처
                </button>
                <button
                  type="button"
                  class="border-2 border-ink rounded-lg px-3 py-2 font-ui text-sm shadow-hard transition duration-150 ease-out hover:-translate-y-1"
                  :class="newEvidenceType === 'photo' ? 'bg-accent' : 'bg-paper'"
                  @click="setEvidenceType('photo')"
                >
                  사진/캡처
                </button>
              </div>

              <template v-if="newEvidenceType === 'text'">
                <textarea
                  v-model="newEvidenceContent"
                  rows="4"
                  class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none resize-y"
                  placeholder="텍스트 증거를 적어주세요. (상황, 날짜, 핵심 주장 등)"
                />
                <p class="m-0 text-xs text-ink/60">{{ newEvidenceContent.trim().length }}자</p>
              </template>

              <template v-else>
                <!-- 업로드 박스 -->
                <label
                  class="border-2 border-ink rounded-lg p-3 bg-paper shadow-hard cursor-pointer transition duration-150 ease-out hover:-translate-y-1"
                  @dragover.prevent
                  @drop.prevent="onEvidenceFileDrop"
                >
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onEvidenceFileSelect"
                  />
                  <template v-if="newEvidencePreviewUrl">
                    <img
                      :src="newEvidencePreviewUrl"
                      alt="선택한 이미지 미리보기"
                      class="w-full max-h-48 object-contain rounded border border-ink bg-paper"
                    />
                    <div class="mt-2 flex items-center justify-between gap-2">
                      <p class="m-0 text-xs text-ink/70 truncate">
                        {{ newEvidenceFile?.name }}
                      </p>
                      <button
                        type="button"
                        class="border-2 border-ink rounded-lg px-2 py-1 font-ui text-xs bg-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 shrink-0"
                        @click.prevent="clearEvidenceFile"
                      >
                        제거
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <p class="m-0 font-ui text-sm font-semibold">이미지 올리기</p>
                    <p class="m-0 text-xs text-ink/70 mt-1">
                      클릭해서 선택하거나, 여기로 드래그&드롭하세요.
                    </p>
                  </template>
                </label>

                <input
                  v-model="newEvidenceDescription"
                  type="text"
                  class="w-full border-2 border-ink rounded-lg px-3 py-2 font-body focus:bg-accent/30 outline-none"
                  :placeholder="
                    newEvidenceType === 'chat' ? '채팅 캡처 설명 (선택)' : '사진 설명 (선택)'
                  "
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
          </div>

          <!-- 증거 나열 -->
          <ul v-if="myEvidenceList.length" class="list-none m-0 p-0 flex flex-col gap-2">
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
                v-if="!myEvidenceComplete"
                type="button"
                class="w-fit text-sm border border-ink rounded px-2 py-1 font-ui opacity-70 hover:opacity-100 transition duration-150"
                @click="removeEvidence(e.id)"
              >
                삭제
              </button>
            </li>
          </ul>
          <p v-else class="m-0 text-sm text-ink/60">아직 추가한 증거가 없어요.</p>

          <!-- 내 쪽 제출 완료 버튼: 대시보드 버튼 바로 위로 이동 -->
          <button
            v-if="!myEvidenceComplete"
            type="button"
            class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:transform-none w-full"
            :disabled="myEvidenceList.length === 0 || submitting"
            @click="submitEvidenceComplete"
          >
            {{ submitting ? '처리 중...' : '내 쪽 제출 완료' }}
          </button>
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

type Role = 'claimant' | 'respondent' | null
const myRole = computed<Role>(() => {
  if (!caseData.value || !user.value?.id) return null
  if (caseData.value.claimantId === user.value.id) return 'claimant'
  if (caseData.value.respondentId === user.value.id) return 'respondent'
  return null
})

const myEvidenceList = computed(() => {
  if (!caseData.value || !myRole.value) return []
  return myRole.value === 'claimant'
    ? caseData.value.claimantEvidence
    : caseData.value.respondentEvidence
})

const myEvidenceComplete = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'claimant'
    ? caseData.value.claimantEvidenceComplete
    : caseData.value.respondentEvidenceComplete
})

const otherEvidenceComplete = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'claimant'
    ? caseData.value.respondentEvidenceComplete
    : caseData.value.claimantEvidenceComplete
})

const opponentEvidenceList = computed(() => {
  if (!caseData.value || !myRole.value) return []
  return myRole.value === 'claimant'
    ? caseData.value.respondentEvidence
    : caseData.value.claimantEvidence
})

const myRebuttalComplete = computed(() => {
  if (!caseData.value || !myRole.value) return false
  return myRole.value === 'claimant'
    ? caseData.value.claimantRebuttalComplete
    : caseData.value.respondentRebuttalComplete
})

const myRebuttals = computed(() => {
  if (!caseData.value || !myRole.value) return {}
  return myRole.value === 'claimant'
    ? caseData.value.claimantRebuttals
    : caseData.value.respondentRebuttals
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
const newEvidencePreviewUrl = ref<string>('')
const submitting = ref(false)

function setEvidenceType(next: EvidenceType) {
  newEvidenceType.value = next
  newEvidenceContent.value = ''
  newEvidenceDescription.value = ''
  clearEvidenceFile()
}

function setEvidenceFile(file: File) {
  if (!file.type.startsWith('image/')) return
  newEvidenceFile.value = file
  if (newEvidencePreviewUrl.value) URL.revokeObjectURL(newEvidencePreviewUrl.value)
  newEvidencePreviewUrl.value = URL.createObjectURL(file)
}

function clearEvidenceFile() {
  if (newEvidencePreviewUrl.value) URL.revokeObjectURL(newEvidencePreviewUrl.value)
  newEvidencePreviewUrl.value = ''
  newEvidenceFile.value = null
}

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
    clearEvidenceFile()
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
  setEvidenceFile(file)
  input.value = ''
}

function onEvidenceFileDrop(ev: DragEvent) {
  const file = ev.dataTransfer?.files?.[0]
  if (!file) return
  setEvidenceFile(file)
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
