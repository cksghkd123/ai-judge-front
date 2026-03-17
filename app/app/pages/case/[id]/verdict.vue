<template>
  <main class="min-h-screen flex flex-col items-center p-6 pb-12 bg-paper text-ink font-body">
    <template v-if="caseData && canShowVerdict">
      <article class="w-full max-w-2xl flex flex-col gap-6">
        <!-- 상단: 사건 제목 + 판결문 헤딩 -->
        <header class="text-center border-b-4 border-ink pb-4">
          <h1 class="font-heading font-extrabold tracking-tight text-2xl m-0">
            {{ caseData.title }}
          </h1>
          <p class="font-heading font-bold tracking-tight text-xl m-0 mt-2">판결문</p>
        </header>

        <!-- 1영역: 사건 요약 + 논점 -->
        <section class="border-4 border-ink rounded-lg p-5 shadow-hard bg-paper">
          <h2 class="font-ui font-semibold text-sm m-0 mb-2">사건 요약</h2>
          <p class="m-0 text-ink/90 text-sm whitespace-pre-wrap">{{ caseData.complaintSummary }}</p>
          <p v-if="caseData.issue" class="m-0 text-ink/80 text-sm mt-2">
            논점: {{ caseData.issue }}
          </p>
          <p class="m-0 text-ink/60 text-xs mt-2">
            사건 생성일: {{ formatDate(caseData.createdAt) }}
          </p>
        </section>

        <!-- 2영역: 청구인 증거 -->
        <section class="border-4 border-ink rounded-lg p-5 shadow-hard bg-paper">
          <h2 class="font-ui font-semibold text-sm m-0 mb-2">청구인 증거</h2>
          <template v-if="caseData.claimantEvidence?.length">
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="e in caseData.claimantEvidence"
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
                    alt="청구인 첨부"
                    class="max-w-full max-h-48 object-contain rounded border border-ink mt-1"
                  />
                  <p v-if="e.content" class="m-0 text-sm text-ink/80 mt-1">
                    {{ e.content }}
                  </p>
                </template>
                <div v-if="rebuttalByEvidenceId[e.id]" class="mt-2 pt-2 border-t border-ink/30">
                  <p class="m-0 font-ui text-xs font-semibold text-ink/80">피청구인의 반박</p>
                  <p class="m-0 text-sm mt-1">
                    {{ rebuttalByEvidenceId[e.id]?.accepted ? '인정' : '불인정' }}
                    <template v-if="rebuttalByEvidenceId[e.id]?.rebuttal">
                      — {{ rebuttalByEvidenceId[e.id]?.rebuttal }}
                    </template>
                  </p>
                </div>
              </li>
            </ul>
          </template>
          <p v-else class="m-0 text-ink/70 text-sm">(제출 증거 없음)</p>
        </section>

        <!-- 3영역: 피청구인 증거 -->
        <section class="border-4 border-ink rounded-lg p-5 shadow-hard bg-paper">
          <h2 class="font-ui font-semibold text-sm m-0 mb-2">피청구인 증거</h2>
          <template v-if="caseData.respondentEvidence?.length">
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="e in caseData.respondentEvidence"
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
                    alt="피청구인 첨부"
                    class="max-w-full max-h-48 object-contain rounded border border-ink mt-1"
                  />
                  <p v-if="e.content" class="m-0 text-sm text-ink/80 mt-1">
                    {{ e.content }}
                  </p>
                </template>
                <div v-if="rebuttalByEvidenceId[e.id]" class="mt-2 pt-2 border-t border-ink/30">
                  <p class="m-0 font-ui text-xs font-semibold text-ink/80">청구인의 반박</p>
                  <p class="m-0 text-sm mt-1">
                    {{ rebuttalByEvidenceId[e.id]?.accepted ? '인정' : '불인정' }}
                    <template v-if="rebuttalByEvidenceId[e.id]?.rebuttal">
                      — {{ rebuttalByEvidenceId[e.id]?.rebuttal }}
                    </template>
                  </p>
                </div>
              </li>
            </ul>
          </template>
          <p v-else class="m-0 text-ink/70 text-sm">(제출 증거 없음)</p>
        </section>

        <!-- 4영역: AI 판결문 본문 (API: judgment_content / 로컬: verdictText) -->
        <section class="border-4 border-ink rounded-lg p-5 shadow-hard bg-accent/30">
          <div class="w-full flex flex-col items-center text-center gap-3 mb-3">
            <div
              v-if="judgeImage"
              class="w-48 h-48 mx-auto border-4 border-ink rounded-lg shadow-hard bg-paper overflow-hidden shrink-0"
            >
              <img
                :src="judgeImage"
                :alt="judgeName ? `${judgeName} 이미지` : '판사 이미지'"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
          <h2 class="font-doodle text-2xl font-bold m-0 text-center">{{ judgeName }}의 판결</h2>
          <p class="m-0 text-ink whitespace-pre-wrap leading-relaxed">
            {{ verdictText || '(판결문 없음)' }}
          </p>
        </section>

        <!-- 5영역: 최종 과실 비율 (API: fault_ratio_creator/counterparty / 로컬: faultRatio) -->
        <section
          v-if="displayFaultRatio"
          class="border-4 border-ink rounded-lg p-5 shadow-hard bg-primary text-paper text-center"
        >
          <h2 class="font-ui font-semibold text-sm m-0 mb-2 opacity-90">최종 과실</h2>
          <p class="font-heading font-extrabold text-2xl m-0 tracking-tight">
            청구인 {{ displayFaultRatio.claimant }} : 피청구인 {{ displayFaultRatio.respondent }}
          </p>
        </section>

        <!-- 하단 CTA -->
        <NuxtLink
          to="/dashboard"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-blue-pen text-paper shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1 w-fit"
        >
          대시보드로 돌아가기
        </NuxtLink>
      </article>
    </template>
    <section
      v-else
      class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
    >
      <p class="m-0 text-ink/80">{{ verdictMessage }}</p>
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
const { getCase, isApiMode, fetchCaseFromApi } = useCaseStore()
const { getEvidenceImageUrl, getCaseResults, getJudgeAgents, getCaseRebuttals } = useCaseApi()

const caseData = computed(() => getCase(caseId))

const { data: agentsList } = await useAsyncData(
  `verdict-agents-${caseId}`,
  async () => (isApiMode() ? getJudgeAgents() : []),
  { server: false },
)

const judgeName = computed(() => {
  const id = caseData.value?.judgeAgentId
  if (!id) return null
  const list = agentsList.value
  if (list?.length) {
    const a = list.find((ag) => ag.id === id)
    return a?.name ?? id
  }
  return id
})

const judgeImage = computed(() => {
  const id = caseData.value?.judgeAgentId
  if (!id) return null
  const list = agentsList.value
  if (list?.length) {
    const a = list.find((ag) => ag.id === id)
    return a?.judge_image || null
  }
  return null
})

const { data: caseResults } = await useAsyncData(
  `verdict-results-${caseId}`,
  async () => {
    if (!isApiMode()) return null
    try {
      await fetchCaseFromApi(caseId)
      return await getCaseResults(caseId)
    } catch {
      return null
    }
  },
  { server: false },
)

const { data: rebuttalsList } = await useAsyncData(
  `verdict-rebuttals-${caseId}`,
  async () => (isApiMode() ? getCaseRebuttals(caseId) : []),
  { server: false },
)

/** evidence_id → 해당 증거에 대한 반박 (상대가 쓴 것) */
const rebuttalByEvidenceId = computed(() => {
  const list = rebuttalsList.value ?? []
  const map: Record<string, { accepted: boolean; rebuttal: string | null }> = {}
  for (const r of list) {
    map[r.evidence_id] = { accepted: r.accepted, rebuttal: r.rebuttal }
  }
  return map
})

const canShowVerdict = computed(() => {
  if (!caseData.value) return false
  if (isApiMode()) {
    const res = caseResults.value
    return res != null && res.status === 'completed'
  }
  return caseData.value.status === 'completed' || Boolean(caseData.value.verdictText)
})

const verdictText = computed(() => {
  if (isApiMode() && caseResults.value?.judgment_content != null) {
    return caseResults.value.judgment_content
  }
  return caseData.value?.verdictText ?? null
})

const displayFaultRatio = computed<{ claimant: number; respondent: number } | null>(() => {
  if (isApiMode() && caseResults.value) {
    const claimant = caseResults.value.fault_ratio_claimant
    const respondent = caseResults.value.fault_ratio_respondent
    if (claimant != null && respondent != null) return { claimant, respondent }
    return null
  }
  return caseData.value?.faultRatio ?? null
})

const verdictMessage = computed(() => {
  if (!caseData.value) return '판결문을 불러올 수 없어요.'
  if (isApiMode() && caseResults.value != null && caseResults.value.status !== 'completed') {
    return '아직 판결이 완료되지 않았어요.'
  }
  return '판결문을 불러올 수 없어요.'
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function evidenceTypeLabel(type: string): string {
  const map: Record<string, string> = { text: '텍스트', chat: '채팅 캡처', photo: '사진/캡처' }
  return map[type] ?? type
}
</script>
