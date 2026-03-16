<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <template v-if="caseData && isParticipant">
      <section
        class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
      >
        <p class="m-0 text-ink/80">이미 이 사건에 참여한 당사자예요.</p>
        <NuxtLink
          :to="`/case/${caseId}`"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard text-center no-underline"
        >
          사건 방으로 가기
        </NuxtLink>
      </section>
    </template>
    <template v-else-if="(caseData && validToken) || (isApiMode() && token && !caseData)">
      <section
        class="w-full max-w-md flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
      >
        <h1 class="font-heading font-extrabold tracking-tight text-xl m-0">내용증명서</h1>
        <p class="m-0 text-ink/80">상대방이 보낸 내용증명입니다. 참여하시겠어요?</p>
        <div class="border-2 border-ink rounded-lg p-4 bg-paper flex flex-col gap-3">
          <p class="text-sm font-ui font-semibold m-0 mb-2 text-ink/70">내용증명 요약</p>
          <template v-if="previewLoading">
            <p class="m-0 text-ink/60 text-sm">불러오는 중...</p>
          </template>
          <template v-else-if="caseData">
            <p class="font-ui font-semibold m-0 text-ink">{{ caseData.title }}</p>
            <p class="text-sm text-ink/80 m-0 mt-2 whitespace-pre-wrap">
              {{ caseData.complaintSummary }}
            </p>
            <p class="text-sm text-ink/60 m-0 mt-2">논점: {{ caseData.issue }}</p>
            <div
              v-if="
                caseData.claimantName ||
                caseData.claimantJobs ||
                caseData.claimantAddress ||
                caseData.claimantProfileImage
              "
              class="mt-3 border-2 border-dashed border-ink/50 rounded-lg p-3 bg-accent/20"
            >
              <p class="m-0 text-xs font-ui font-semibold text-ink/80">
                청구인 인적사항
              </p>
              <div class="mt-2 flex items-start gap-3">
                <div
                  class="w-14 h-14 rounded-full border-2 border-ink/40 bg-paper overflow-hidden flex items-center justify-center shrink-0"
                >
                  <img
                    v-if="caseData.claimantProfileImage"
                    :src="caseData.claimantProfileImage"
                    alt="청구인 프로필"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="font-doodle text-xl text-ink/70" aria-hidden="true">✍️</span>
                </div>
                <dl class="m-0 space-y-1 text-sm flex-1">
                  <div v-if="caseData.claimantName" class="flex gap-2">
                    <dt class="font-ui font-semibold w-14 text-ink/70">이름</dt>
                    <dd class="m-0 flex-1">{{ caseData.claimantName }}</dd>
                  </div>
                  <div v-if="caseData.claimantJobs" class="flex gap-2">
                    <dt class="font-ui font-semibold w-14 text-ink/70">직업</dt>
                    <dd class="m-0 flex-1">{{ caseData.claimantJobs }}</dd>
                  </div>
                  <div v-if="caseData.claimantAddress" class="flex gap-2">
                    <dt class="font-ui font-semibold w-14 text-ink/70">주소</dt>
                    <dd class="m-0 flex-1 whitespace-pre-wrap">
                      {{ caseData.claimantAddress }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </template>
          <template v-else>
            <p class="m-0 text-sm text-ink/60">
              내용을 불러올 수 없어요. 참여하기를 누르면 사건에 참여할 수 있어요.
            </p>
          </template>
        </div>
        <p v-if="joinError" class="m-0 text-sm text-red-600">{{ joinError }}</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:transform-none"
            :disabled="loading"
            @click="accept"
          >
            {{ loading ? '처리 중...' : '참여하기' }}
          </button>
          <NuxtLink
            to="/dashboard"
            class="flex-1 border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-paper text-ink shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
          >
            거절
          </NuxtLink>
        </div>
      </section>
    </template>
    <template v-else-if="caseData && !validToken && !isParticipant">
      <section
        class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
      >
        <p class="m-0 text-ink/80">
          유효하지 않은 초대 링크예요. 토큰이 없거나 만료되었을 수 있어요.
        </p>
        <NuxtLink
          to="/dashboard"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard text-center no-underline"
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
// 인증 없이 접근 가능 (초대 링크는 비로그인/비회원도 열 수 있음)
definePageMeta({})

const route = useRoute()
const router = useRouter()
const caseId = route.params.id as string
const token = computed(() => (route.query.token as string) || '')
const { getCase, joinCase, isApiMode, fetchCasePreviewFromApi } = useCaseStore()
const { user } = useAuth()

const caseData = computed(() => getCase(caseId))
const previewLoading = ref(false)

onMounted(async () => {
  if (isApiMode() && token.value && !caseData.value) {
    previewLoading.value = true
    await fetchCasePreviewFromApi(caseId, token.value)
    previewLoading.value = false
  }
})

const validToken = computed(() => {
  const c = caseData.value
  if (!token.value) return false
  if (isApiMode() && !c) return true
  return Boolean(c && c.inviteToken === token.value)
})

const isParticipant = computed(() => {
  const c = caseData.value
  const uid = user.value?.id
  if (!c || !uid) return false
  return c.claimantId === uid || c.respondentId === uid
})

const loading = ref(false)
const joinError = ref('')

async function accept() {
  if (!token.value || !validToken.value) return
  if (!user.value?.id) {
    // 비로그인: 로그인 후 이 페이지로 돌아오도록 redirect
    await navigateTo(`/sign-in?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  loading.value = true
  joinError.value = ''
  try {
    const ok = await joinCase(caseId, token.value, user.value.id)
    if (ok) router.push(`/case/${caseId}`)
  } catch (e: unknown) {
    const msg =
      e &&
      typeof e === 'object' &&
      'data' in e &&
      (e as { data?: { detail?: string } }).data?.detail
    joinError.value =
      typeof msg === 'string' ? msg : '참여에 실패했어요. 링크가 유효한지 확인해 주세요.'
  } finally {
    loading.value = false
  }
}
</script>
