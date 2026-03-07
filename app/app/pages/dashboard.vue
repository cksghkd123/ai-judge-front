<template>
  <main class="min-h-screen flex flex-col p-6 pb-12 bg-paper text-ink font-body">
    <div class="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <p class="m-0 text-ink/80 text-sm">
        {{ user?.user_metadata?.full_name ?? user?.email ?? '사용자' }}님, 환영해요.
      </p>

      <!-- 진행 중인 사건 -->
      <section class="flex flex-col gap-2">
        <h2 class="font-ui font-semibold text-sm m-0 text-ink/80">진행 중인 사건</h2>
        <div v-if="ongoingCases.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NuxtLink
            v-for="c in ongoingCases"
            :key="c.id"
            :to="`/case/${c.id}`"
            class="block border-2 border-ink rounded-lg p-4 no-underline text-ink bg-paper transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-ink/5"
          >
            <p class="font-ui font-semibold m-0 text-ink line-clamp-2">{{ c.title }}</p>
            <p class="m-0 text-xs text-ink/60 mt-1.5">
              {{ caseStatusLabel(c.status) }}
              <span class="text-ink/40">·</span>
              {{ myRoleInCase(c) }}
            </p>
          </NuxtLink>
        </div>
        <p v-else class="m-0 text-sm text-ink/50">진행 중인 사건이 없어요.</p>
      </section>

      <!-- 완료된 사건 -->
      <section class="flex flex-col gap-2">
        <h2 class="font-ui font-semibold text-sm m-0 text-ink/80">완료된 사건</h2>
        <div v-if="completedCases.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NuxtLink
            v-for="c in completedCases"
            :key="c.id"
            :to="`/case/${c.id}/verdict`"
            class="block border-2 border-ink rounded-lg p-4 no-underline text-ink bg-paper transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-ink/5"
          >
            <p class="font-ui font-semibold m-0 text-ink line-clamp-2">{{ c.title }}</p>
            <p class="m-0 text-xs text-ink/60 mt-1.5">
              {{ myRoleInCase(c) }}
              <span class="text-ink/40">·</span>
              판결 완료
            </p>
          </NuxtLink>
        </div>
        <p v-else class="m-0 text-sm text-ink/50">완료된 사건이 없어요.</p>
      </section>

      <!-- 내용증명 보내기 -->
      <NuxtLink
        to="/complaint/new"
        class="block w-full border-2 border-ink rounded-lg px-4 py-3 font-ui font-semibold text-ink bg-paper text-center no-underline transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-ink/5"
      >
        내용증명 보내기
      </NuxtLink>

      <!-- 하단: 내 정보, 로그아웃 -->
      <div class="flex flex-col gap-2 mt-4 pt-4 border-t-2 border-ink/20">
        <NuxtLink
          to="/profile"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold text-ink bg-paper text-center no-underline transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-ink/5"
        >
          내 정보
        </NuxtLink>
        <button
          type="button"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold text-ink bg-paper transition duration-150 ease-out hover:-translate-y-0.5 hover:bg-ink/10 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          :disabled="loggingOut"
          @click="handleSignOut"
        >
          {{ loggingOut ? '로그아웃 중...' : '로그아웃' }}
        </button>
      </div>
    </div>
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
  return Object.values(cases.value)
    .filter((c) => c.plaintiffId === uid || c.defendantId === uid)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const ongoingCases = computed(() => myCases.value.filter((c) => c.status !== 'completed'))

const completedCases = computed(() => myCases.value.filter((c) => c.status === 'completed'))

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
