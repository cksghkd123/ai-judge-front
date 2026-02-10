<template>
  <main
    class="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-ink font-body"
  >
    <div class="w-full max-w-md flex flex-col gap-6">
      <NuxtLink
        to="/dashboard"
        class="self-start text-blue-pen hover:underline font-ui text-lg transition duration-150 ease-out"
      >
        ← 대시보드로 돌아가기
      </NuxtLink>

      <section class="border-4 border-ink bg-paper p-6 rounded-lg shadow-hard flex flex-col gap-4">
        <h1 class="font-heading font-extrabold tracking-tight text-2xl m-0 text-center">고소인 인적사항</h1>

        <div class="flex flex-col gap-3 p-4">
          <!-- 고소인 -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-heading text-ink shrink-0 w-20">고소인</span>
            <template v-if="editingName">
              <input
                v-model="editFullName"
                type="text"
                class="border-2 border-ink rounded-lg px-3 py-1.5 font-body flex-1 min-w-0 focus:bg-accent focus:outline-none"
                placeholder="이름"
                @keydown.enter="confirmEditName"
              />
              <button
                type="button"
                class="btn-primary font-ui text-sm py-1.5 shrink-0"
                @click="confirmEditName"
              >
                완료
              </button>
            </template>
            <template v-else>
              <span class="font-body">{{ displayName || '—' }}</span>
              <button
                type="button"
                class="p-1.5 rounded-lg border-2 border-ink hover:bg-accent transition duration-150 ease-out hover:-translate-y-0.5 shrink-0"
                aria-label="이름 수정"
                @click="startEditName"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  class="text-ink"
                >
                  <path
                    d="M227.31 73.37L182.63 28.68a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63ZM48 208v-44.69l76-76L180.69 84l-76 76H48Zm148.69-107.31l-24 24-52.38-52.38 24-24 52.38 52.38Z"
                  />
                </svg>
              </button>
            </template>
          </div>

          <!-- 이메일 -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-heading text-ink shrink-0 w-20">이메일</span>
            <span class="font-body text-ink/90">{{ user?.email ?? '—' }}</span>
            <span class="text-xs text-ink/60">{{ providerLabel }}</span>
          </div>

          <!-- 직업 (최대 5개) -->
          <div class="flex flex-wrap items-start gap-2">
            <span class="font-heading text-ink shrink-0 w-20">직업</span>
            <template v-if="editingJob">
              <div class="flex flex-col gap-2 flex-1 min-w-0">
                <div
                  v-for="(_, i) in editJobs"
                  :key="i"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="editJobs[i]"
                    type="text"
                    class="border-2 border-ink rounded-lg px-3 py-1.5 font-body flex-1 min-w-0 focus:bg-accent focus:outline-none"
                    :placeholder="`직업 ${i + 1}`"
                  />
                  <button
                    type="button"
                    class="p-1.5 rounded-lg border-2 border-ink hover:bg-primary hover:text-paper hover:border-primary transition duration-150 shrink-0"
                    aria-label="삭제"
                    @click="removeJob(i)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M216 48H40a8 8 0 0 0 0 16h8v144a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16ZM160 192H96V80h64Z"/>
                    </svg>
                  </button>
                </div>
                <button
                  v-if="editJobs.length < 5"
                  type="button"
                  class="btn-secondary font-ui text-sm py-1.5 self-start"
                  @click="addJob"
                >
                  + 직업 추가
                </button>
                <button type="button" class="btn-primary font-ui text-sm py-1.5 self-start" @click="confirmEditJob">
                  완료
                </button>
              </div>
            </template>
            <template v-else>
              <span class="font-body">{{ displayJob || '—' }}</span>
              <button
                type="button"
                class="p-1.5 rounded-lg border-2 border-ink hover:bg-accent transition duration-150 ease-out hover:-translate-y-0.5 shrink-0"
                aria-label="직업 수정"
                @click="startEditJob"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  class="text-ink"
                >
                  <path
                    d="M227.31 73.37L182.63 28.68a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63ZM48 208v-44.69l76-76L180.69 84l-76 76H48Zm148.69-107.31l-24 24-52.38-52.38 24-24 52.38 52.38Z"
                  />
                </svg>
              </button>
            </template>
          </div>

          <!-- 주소 -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-heading text-ink shrink-0 w-20">주소</span>
            <template v-if="editingAddress">
              <input
                v-model="editAddress"
                type="text"
                class="border-2 border-ink rounded-lg px-3 py-1.5 font-body flex-1 min-w-0 focus:bg-accent focus:outline-none"
                placeholder="주소"
                @keydown.enter="confirmEditAddress"
              />
              <button
                type="button"
                class="btn-primary font-ui text-sm py-1.5 shrink-0"
                @click="confirmEditAddress"
              >
                완료
              </button>
            </template>
            <template v-else>
              <span class="font-body">{{ displayAddress || '—' }}</span>
              <button
                type="button"
                class="p-1.5 rounded-lg border-2 border-ink hover:bg-accent transition duration-150 ease-out hover:-translate-y-0.5 shrink-0"
                aria-label="주소 수정"
                @click="startEditAddress"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  class="text-ink"
                >
                  <path
                    d="M227.31 73.37L182.63 28.68a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63ZM48 208v-44.69l76-76L180.69 84l-76 76H48Zm148.69-107.31l-24 24-52.38-52.38 24-24 52.38 52.38Z"
                  />
                </svg>
              </button>
            </template>
          </div>
        </div>

        <NuxtLink
          to="/complaints"
          class="btn-secondary font-ui w-full text-center"
        >
          고소내역
        </NuxtLink>

        <p
          v-if="profileMessage"
          :class="profileError ? 'text-primary' : 'text-ink/80'"
          class="text-sm m-0"
        >
          {{ profileMessage }}
        </p>

        <div class="flex flex-row gap-2 pt-2">
          <button type="button" :disabled="loggingOut" class="btn-secondary font-ui flex-1" @click="handleSignOut">
            {{ loggingOut ? '로그아웃 중...' : '로그아웃' }}
          </button>
          <button type="button" class="btn-danger font-ui flex-1" @click="showWithdrawModal = true">
            회원탈퇴
          </button>
        </div>
      </section>
    </div>

    <!-- 이름 수정 확인 모달 -->
    <div
      v-if="showEditNameCompleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
      @click.self="showEditNameCompleteModal = false"
    >
      <div
        class="border-4 border-ink bg-paper p-6 rounded-lg shadow-hard max-w-sm w-full flex flex-col gap-4"
        role="dialog"
        aria-labelledby="edit-name-title"
        aria-modal="true"
      >
        <h2 id="edit-name-title" class="font-heading tracking-tight text-xl m-0">수정하시겠어요?</h2>
        <p class="text-sm m-0 text-ink/80">
          이제 "{{ editFullName || '이름 없음' }}" 으로 사람들에게 보일 거예요.
        </p>
        <div class="flex gap-2 justify-end">
          <button type="button" class="btn-secondary font-ui" @click="showEditNameCompleteModal = false">
            취소
          </button>
          <button type="button" :disabled="saving" class="btn-primary font-ui" @click="confirmSaveName">
            {{ saving ? '저장 중...' : '확인' }}
          </button>
        </div>
      </div>
    </div>
    <!-- 탈퇴 확인 모달 -->
    <Teleport to="body">
      <div
        v-if="showWithdrawModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
        @click.self="showWithdrawModal = false"
      >
        <div
          class="border-4 border-ink bg-paper p-6 rounded-lg shadow-hard max-w-sm w-full flex flex-col gap-4"
          role="dialog"
          aria-labelledby="withdraw-title"
          aria-modal="true"
        >
          <h2 id="withdraw-title" class="font-heading tracking-tight text-xl m-0">정말 탈퇴하시겠어요?</h2>
          <p class="text-sm m-0 text-ink/80">
            탈퇴 시 계정이 삭제됩니다. 이 작업은 되돌릴 수 없어요.
          </p>
          <div class="flex gap-2 justify-end">
            <button type="button" class="btn-secondary font-ui" @click="showWithdrawModal = false">
              취소
            </button>
            <button
              type="button"
              :disabled="withdrawing"
              class="btn-danger"
              @click="confirmWithdraw"
            >
              {{ withdrawing ? '처리 중...' : '탈퇴하기' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { user, signOut } = useAuth()
const supabase = useNuxtApp().$supabase
const router = useRouter()

const displayName = computed(
  () => (user.value?.user_metadata?.full_name as string) || user.value?.email || '',
)
/** 직업 배열을 메타데이터에서 읽어옴 (문자열이면 1개짜리 배열로) */
const jobsFromMetadata = computed(() => {
  const raw = user.value?.user_metadata?.job
  if (Array.isArray(raw)) return (raw as string[]).slice(0, 5).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return []
})
const displayJob = computed(() => jobsFromMetadata.value.join(', ') || '')
const displayAddress = computed(() => (user.value?.user_metadata?.address as string) || '')
const providerLabel = computed(() => {
  const p = user.value?.app_metadata?.provider as string | undefined
  if (!p) return ''
  if (p === 'kakao') return '(카카오)'
  if (p === 'google') return '(구글)'
  return `(${p})`
})

const editFullName = ref('')
const editJobs = ref<string[]>([])
const editAddress = ref('')
const saving = ref(false)
const profileMessage = ref('')
const profileError = ref(false)
const loggingOut = ref(false)
const showEditNameCompleteModal = ref(false)
const editingName = ref(false)
const editingJob = ref(false)
const editingAddress = ref(false)
const showWithdrawModal = ref(false)
const withdrawing = ref(false)

watch(
  user,
  (u) => {
    if (u) {
      editFullName.value = (u.user_metadata?.full_name as string) || ''
      const raw = u.user_metadata?.job
      editJobs.value = Array.isArray(raw)
        ? (raw as string[]).slice(0, 5).filter(Boolean)
        : typeof raw === 'string' && raw.trim()
          ? [raw.trim()]
          : []
      editAddress.value = (u.user_metadata?.address as string) || ''
    }
  },
  { immediate: true },
)

function startEditName() {
  editingName.value = true
  editFullName.value = (user.value?.user_metadata?.full_name as string) || ''
}

function confirmEditName() {
  if (!editFullName.value?.trim()) return
  editingName.value = false
  showEditNameCompleteModal.value = true
}

async function confirmSaveName() {
  await saveProfile()
  showEditNameCompleteModal.value = false
}

function startEditJob() {
  editingJob.value = true
  editJobs.value = [...jobsFromMetadata.value]
  if (editJobs.value.length === 0) editJobs.value = ['']
}

function addJob() {
  if (editJobs.value.length < 5) editJobs.value = [...editJobs.value, '']
}

function removeJob(index: number) {
  editJobs.value = editJobs.value.filter((_, i) => i !== index)
  if (editJobs.value.length === 0) editJobs.value = ['']
}

function confirmEditJob() {
  const trimmed = editJobs.value.map((j) => j.trim()).filter(Boolean)
  editJobs.value = trimmed.length ? trimmed : []
  editingJob.value = false
  saveProfile()
}

function startEditAddress() {
  editingAddress.value = true
  editAddress.value = (user.value?.user_metadata?.address as string) || ''
}

function confirmEditAddress() {
  editingAddress.value = false
  saveProfile()
}

const hasProfileChanges = computed(() => {
  if (!user.value) return false
  const currentName = (user.value.user_metadata?.full_name as string) || ''
  const newJobs = editJobs.value.map((j) => j.trim()).filter(Boolean)
  const currentJobs = jobsFromMetadata.value
  const jobChanged =
    newJobs.length !== currentJobs.length ||
    newJobs.some((j, i) => (currentJobs[i] ?? '') !== j)
  const currentAddress = (user.value.user_metadata?.address as string) || ''
  return (
    editFullName.value !== currentName ||
    jobChanged ||
    editAddress.value !== currentAddress
  )
})

async function saveProfile() {
  if (!supabase || !hasProfileChanges.value) return
  profileMessage.value = ''
  profileError.value = false
  saving.value = true
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: editFullName.value || undefined,
      job: editJobs.value.length ? editJobs.value : undefined,
      address: editAddress.value || undefined,
    },
  })
  saving.value = false
  if (error) {
    profileMessage.value = error.message || '저장에 실패했어요.'
    profileError.value = true
  } else {
    profileMessage.value = '저장했어요.'
  }
}

async function handleSignOut() {
  loggingOut.value = true
  try {
    await signOut()
    await router.replace('/')
  } finally {
    loggingOut.value = false
  }
}

function confirmWithdraw() {
  withdrawing.value = true
  // 실제 삭제는 Edge Function/백엔드 연동 시 해당 엔드포인트 호출
  setTimeout(() => {
    withdrawing.value = false
    showWithdrawModal.value = false
    profileMessage.value = '탈퇴 기능은 백엔드 연동 후 사용할 수 있어요.'
    profileError.value = true
  }, 500)
}
</script>
