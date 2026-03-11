<template>
  <main
    class="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-ink font-body"
  >
    <p v-if="!caseData && !notFound" class="m-0 text-ink/80">사건 정보를 불러오는 중...</p>
    <section
      v-else-if="notFound"
      class="w-full max-w-md flex flex-col gap-4 border-4 border-ink bg-paper p-6 rounded-lg shadow-hard"
    >
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
const { getCase, isApiMode, fetchCaseFromApi } = useCaseStore()

const { data: _fetched } = await useAsyncData(
  `case-redirect-${caseId}`,
  async () => {
    if (isApiMode()) return fetchCaseFromApi(caseId)
    return null
  },
  { server: false },
)

const caseData = computed(() => getCase(caseId))
const notFound = ref(false)

watch(
  [caseData, _fetched],
  ([data, fetched]) => {
    if (data) {
      const status = data.status
      if (status === 'completed') {
        router.replace(`/case/${caseId}/verdict`)
      } else {
        router.replace(`/case/${caseId}/${status}`)
      }
      return
    }
    if (fetched !== undefined && !data) {
      notFound.value = true
    }
  },
  { immediate: true },
)
</script>
