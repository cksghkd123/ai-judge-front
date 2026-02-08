<template>
  <main class="min-h-screen flex flex-col items-center justify-center p-6 bg-paper text-ink font-body">
    <div class="w-full max-w-md flex flex-col gap-6">
      <NuxtLink
        to="/dashboard"
        class="self-start text-blue-pen hover:underline font-heading text-lg transition duration-150 ease-out"
      >
        ← 대시보드로 돌아가기
      </NuxtLink>

      <section
        class="border-4 border-ink bg-paper p-6 rounded-lg shadow-hard flex flex-col gap-4"
      >
        <h1 class="font-heading text-2xl m-0">내 정보</h1>

        <!-- 조회 영역 -->
        <div class="flex flex-col items-center gap-3">
          <img
            v-if="user?.user_metadata?.avatar_url"
            :src="user.user_metadata.avatar_url"
            :alt="displayName"
            class="w-20 h-20 rounded-lg border-2 border-ink object-cover"
          />
          <div
            v-else
            class="w-20 h-20 rounded-lg border-2 border-ink bg-accent flex items-center justify-center font-heading text-2xl"
          >
            {{ (displayName || '?').charAt(0) }}
          </div>
          <p class="font-heading text-xl m-0">{{ displayName || '이름 없음' }}</p>
          <p class="text-sm m-0 text-ink/80">{{ user?.email ?? '-' }}</p>
          <p class="text-sm m-0 text-ink/70">
            로그인 수단: {{ providerLabel }}
          </p>
        </div>

        <!-- 프로필 수정 -->
        <div class="border-t-2 border-ink pt-4 flex flex-col gap-3">
          <h2 class="font-heading text-lg m-0">프로필 수정</h2>
          <div class="flex flex-col gap-2">
            <label for="full_name" class="text-sm font-medium">표시 이름</label>
            <input
              id="full_name"
              v-model="editFullName"
              type="text"
              class="border-2 border-ink rounded-lg px-3 py-2 bg-paper focus:bg-accent focus:outline-none transition duration-150 ease-out"
              placeholder="이름을 입력하세요"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="avatar_url" class="text-sm font-medium">프로필 이미지 URL</label>
            <input
              id="avatar_url"
              v-model="editAvatarUrl"
              type="url"
              class="border-2 border-ink rounded-lg px-3 py-2 bg-paper focus:bg-accent focus:outline-none transition duration-150 ease-out"
              placeholder="https://..."
            />
          </div>
          <button
            type="button"
            :disabled="saving || !hasProfileChanges"
            class="btn-primary"
            @click="saveProfile"
          >
            {{ saving ? '저장 중...' : '저장' }}
          </button>
          <p v-if="profileMessage" class="text-sm m-0" :class="profileError ? 'text-primary' : 'text-ink/80'">
            {{ profileMessage }}
          </p>
        </div>

        <!-- 계정 관리 -->
        <div class="border-t-2 border-ink pt-4 flex flex-col gap-3">
          <h2 class="font-heading text-lg m-0">계정 관리</h2>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              :disabled="loggingOut"
              class="btn-secondary"
              @click="handleSignOut"
            >
              {{ loggingOut ? '로그아웃 중...' : '로그아웃' }}
            </button>
            <button
              type="button"
              class="btn-danger"
              @click="showWithdrawModal = true"
            >
              탈퇴하기
            </button>
          </div>
        </div>
      </section>
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
          <h2 id="withdraw-title" class="font-heading text-xl m-0">
            정말 탈퇴하시겠어요?
          </h2>
          <p class="text-sm m-0 text-ink/80">
            탈퇴 시 계정이 삭제됩니다. 이 작업은 되돌릴 수 없어요.
          </p>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              class="btn-secondary"
              @click="showWithdrawModal = false"
            >
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
const providerLabel = computed(() => {
  const p = user.value?.app_metadata?.provider as string | undefined
  if (!p) return '-'
  if (p === 'kakao') return '카카오'
  if (p === 'google') return '구글'
  return p
})

const editFullName = ref('')
const editAvatarUrl = ref('')
const saving = ref(false)
const profileMessage = ref('')
const profileError = ref(false)
const loggingOut = ref(false)
const showWithdrawModal = ref(false)
const withdrawing = ref(false)

watch(
  user,
  (u) => {
    if (u) {
      editFullName.value = (u.user_metadata?.full_name as string) || ''
      editAvatarUrl.value = (u.user_metadata?.avatar_url as string) || ''
    }
  },
  { immediate: true },
)

const hasProfileChanges = computed(() => {
  if (!user.value) return false
  const currentName = (user.value.user_metadata?.full_name as string) || ''
  const currentAvatar = (user.value.user_metadata?.avatar_url as string) || ''
  return editFullName.value !== currentName || editAvatarUrl.value !== currentAvatar
})

async function saveProfile() {
  if (!supabase || !hasProfileChanges.value) return
  profileMessage.value = ''
  profileError.value = false
  saving.value = true
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: editFullName.value || undefined,
      avatar_url: editAvatarUrl.value || undefined,
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

<style scoped>
.btn-primary {
  @apply border-2 border-ink rounded-lg px-4 py-2 font-heading font-semibold bg-primary text-paper shadow-hard transition duration-150 ease-out;
  @apply hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none;
}

.btn-secondary {
  @apply border-2 border-ink rounded-lg px-4 py-2 font-heading font-semibold bg-paper text-ink shadow-hard transition duration-150 ease-out;
  @apply hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none;
}

.btn-danger {
  @apply border-2 border-ink rounded-lg px-4 py-2 font-heading font-semibold bg-paper text-primary border-primary shadow-hard transition duration-150 ease-out;
  @apply hover:-translate-y-1;
}
</style>
