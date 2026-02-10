<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <template v-if="caseData">
      <section class="w-full max-w-md flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
        <h1 class="font-heading font-extrabold tracking-tight text-xl m-0">초대 수락</h1>
        <p class="m-0 text-ink/80">
          원고에게 고소당한 사건입니다. 참여하시겠어요?
        </p>
        <div class="border-2 border-ink rounded-lg p-4 bg-paper">
          <p class="font-ui font-semibold m-0">{{ caseData.title }}</p>
          <p class="text-sm text-ink/70 m-0 mt-2 line-clamp-3">{{ caseData.complaintSummary }}</p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out hover:-translate-y-1 disabled:opacity-60 disabled:transform-none"
            :disabled="loading"
            @click="accept"
          >
            {{ loading ? '처리 중...' : '수락' }}
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
const router = useRouter()
const caseId = route.params.id as string
const { getCase, updateCase } = useCaseStore()
const { user } = useAuth()

const caseData = computed(() => getCase(caseId))
const loading = ref(false)

function accept() {
  if (!caseData.value || !user.value?.id) return
  loading.value = true
  updateCase(caseId, { status: 'matched', defendantId: user.value.id })
  loading.value = false
  router.push(`/case/${caseId}`)
}
</script>
