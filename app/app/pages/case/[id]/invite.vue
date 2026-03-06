<template>
  <main class="min-h-screen flex flex-col items-center p-6 bg-paper text-ink font-body">
    <template v-if="caseData">
      <section class="w-full max-w-md flex flex-col gap-5 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard">
        <h1 class="font-heading font-extrabold tracking-tight text-xl m-0">내용증명 전달용 링크</h1>
        <p class="m-0 text-ink/80 text-sm">
          위 링크를 상대에게 보내면, 상대가 이 내용증명에 대해 참여·답변할 수 있어요.
        </p>
        <div class="flex flex-col gap-2">
          <label class="font-ui text-sm font-semibold">공유 링크</label>
          <div class="flex gap-2">
            <input
              :value="inviteUrl"
              readonly
              class="flex-1 border-2 border-ink rounded-lg px-3 py-2 font-body bg-paper text-ink text-sm outline-none"
            />
            <button
              type="button"
              class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-accent shadow-hard transition duration-150 ease-out hover:-translate-y-1 shrink-0"
              @click="copyUrl"
            >
              {{ copied ? '복사됨!' : '복사' }}
            </button>
          </div>
        </div>
        <NuxtLink
          :to="`/case/${caseData.id}`"
          class="border-2 border-ink rounded-lg px-4 py-2 font-ui font-semibold bg-blue-pen text-paper shadow-hard text-center no-underline transition duration-150 ease-out hover:-translate-y-1"
        >
          사건 방으로 가기
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
const { getCase } = useCaseStore()

const caseData = computed(() => getCase(caseId))

const inviteUrl = computed(() => {
  if (!caseData.value?.inviteToken) return ''
  if (import.meta.client && typeof window !== 'undefined') {
    return `${window.location.origin}/cases/${caseId}?token=${encodeURIComponent(caseData.value.inviteToken)}`
  }
  return `/cases/${caseId}?token=${encodeURIComponent(caseData.value.inviteToken)}`
})

const copied = ref(false)

function copyUrl() {
  if (!import.meta.client) return
  navigator.clipboard.writeText(inviteUrl.value).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}
</script>
