<template>
  <main class="min-h-screen flex flex-col items-center p-6 pb-12 bg-paper text-ink font-body">
    <template v-if="caseData && (caseData.status === 'completed' || caseData.verdictText)">
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

        <!-- 2영역: 원고 증거 -->
        <section class="border-4 border-ink rounded-lg p-5 shadow-hard bg-paper">
          <h2 class="font-ui font-semibold text-sm m-0 mb-2">원고 증거</h2>
          <template v-if="caseData.plaintiffEvidence?.length">
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="e in caseData.plaintiffEvidence"
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
                    alt="원고 첨부"
                    class="max-w-full max-h-48 object-contain rounded border border-ink mt-1"
                  />
                  <p v-if="e.content" class="m-0 text-sm text-ink/80 mt-1">
                    {{ e.content }}
                  </p>
                </template>
              </li>
            </ul>
          </template>
          <p v-else class="m-0 text-ink/70 text-sm">(제출 증거 없음)</p>
        </section>

        <!-- 3영역: 피고 증거 -->
        <section class="border-4 border-ink rounded-lg p-5 shadow-hard bg-paper">
          <h2 class="font-ui font-semibold text-sm m-0 mb-2">피고 증거</h2>
          <template v-if="caseData.defendantEvidence?.length">
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="e in caseData.defendantEvidence"
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
                    alt="피고 첨부"
                    class="max-w-full max-h-48 object-contain rounded border border-ink mt-1"
                  />
                  <p v-if="e.content" class="m-0 text-sm text-ink/80 mt-1">
                    {{ e.content }}
                  </p>
                </template>
              </li>
            </ul>
          </template>
          <p v-else class="m-0 text-ink/70 text-sm">(제출 증거 없음)</p>
        </section>

        <!-- 4영역: AI 판결문 본문 -->
        <section class="border-4 border-ink rounded-lg p-5 shadow-hard bg-accent/30">
          <h2 class="font-doodle text-lg font-bold m-0 mb-3">판사님의 판결</h2>
          <p class="m-0 text-ink whitespace-pre-wrap leading-relaxed">
            {{ caseData.verdictText || '(판결문 없음)' }}
          </p>
        </section>

        <!-- 5영역: 최종 과실 비율 -->
        <section
          v-if="caseData.faultRatio"
          class="border-4 border-ink rounded-lg p-5 shadow-hard bg-primary text-paper text-center"
        >
          <h2 class="font-ui font-semibold text-sm m-0 mb-2 opacity-90">최종 과실</h2>
          <p class="font-heading font-extrabold text-2xl m-0 tracking-tight">
            원고 {{ caseData.faultRatio.plaintiff }} : 피고 {{ caseData.faultRatio.defendant }}
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
      <p class="m-0 text-ink/80">판결문을 불러올 수 없어요.</p>
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
const { getCase } = useCaseStore()
const { getEvidenceImageUrl } = useCaseApi()

const caseData = computed(() => getCase(caseId))

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
