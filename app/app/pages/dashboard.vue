<template>
  <main class="min-h-screen flex flex-col items-center p-6 pb-12 bg-paper text-ink font-body">
    <section class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
      <h1 class="font-heading font-extrabold tracking-tight text-2xl m-0">대시보드</h1>
      <p class="m-0 text-ink/80">
        환영해요, {{ user?.user_metadata?.full_name ?? user?.email ?? '판사님' }}!
      </p>

      <!-- 진행 중인 사건 목록 -->
      <div v-if="myCases.length > 0" class="flex flex-col gap-2">
        <h2 class="font-ui font-semibold text-sm m-0">진행 중인 사건</h2>
        <ul class="list-none m-0 p-0 flex flex-col gap-2">
          <li v-for="c in myCases" :key="c.id">
            <NuxtLink
              :to="`/case/${c.id}`"
              class="block border-2 border-ink rounded-lg p-3 no-underline text-ink transition duration-150 ease-out hover:-translate-y-1 hover:bg-accent/20"
            >
              <p class="font-ui font-semibold m-0">{{ c.title }}</p>
              <p class="m-0 text-sm text-ink/70 mt-1">
                {{ caseStatusLabel(c.status) }}
                <span class="text-ink/50">·</span>
                {{ myRoleInCase(c) }}
              </p>
            </NuxtLink>
          </li>
        </ul>
      </div>
      <p v-else class="m-0 text-sm text-ink/60">진행 중인 사건이 없어요. 내용증명을 보내 보세요!</p>

      <div class="flex flex-col gap-2 mt-2">
        <NuxtLink
          to="/complaint/new"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          내용증명 보내기
        </NuxtLink>
        <NuxtLink
          to="/profile"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-blue-pen text-paper shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          내 정보
        </NuxtLink>
        <button
          type="button"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-ink text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          :disabled="loggingOut"
          @click="handleSignOut"
        >
          {{ loggingOut ? '로그아웃 중...' : '로그아웃' }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { CaseData } from '~/composables/useCaseStore'

definePageMeta({ middleware: 'auth' })

const { user, signOut } = useAuth()
const { cases } = useCaseStore()
const router = useRouter()
const loggingOut = ref(false)

const myCases = computed(() => {
  const uid = user.value?.id
  if (!uid) return []
  return Object.values(cases.value).filter(
    (c) => c.plaintiffId === uid || c.defendantId === uid
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

function caseStatusLabel(status: CaseData['status']): string {
  const map: Record<CaseData['status'], string> = {
    pending: '상대 참여 대기',
    active: '증거 제출 중',
    reviewing: '상대 증거 검토 중',
    judging: '판결 중',
    completed: '판결 완료',
  }
  return map[status] ?? status
}

function myRoleInCase(c: CaseData): string {
  const uid = user.value?.id
  if (!uid) return ''
  if (c.plaintiffId === uid) return '원고'
  if (c.defendantId === uid) return '피고'
  return ''
}

const handleSignOut = async () => {
  loggingOut.value = true
  try {
    await signOut()
    await router.replace('/')
  } finally {
    loggingOut.value = false
  }
}
</script>
