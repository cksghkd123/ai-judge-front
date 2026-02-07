<template>
  <div />
</template>

<script setup lang="ts">
/**
 * 존재하지 않는 URL 접속 시:
 * - 비로그인 → 랜딩(/)
 * - 로그인 → 대시보드(/dashboard)
 */
const { isLoggedIn } = useAuth()
const router = useRouter()

onMounted(() => {
  if (isLoggedIn.value) {
    router.replace('/dashboard')
  } else {
    router.replace('/')
  }
})
</script>
