export type MeResponse = {
  id: string
  email?: string | null
  role?: string | null
  user_metadata?: Record<string, unknown> | null
  app_metadata?: Record<string, unknown> | null
}

function normalizeApiBase(base: string): string {
  return (base || '').replace(/\/$/, '')
}

export function useAuthApi() {
  const config = useRuntimeConfig()
  const supabase = useNuxtApp().$supabase

  async function getAccessToken(): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured')
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('No access token')
    return token
  }

  function getApiBase(): string {
    const base = normalizeApiBase((config.public.apiBase as string) || '')
    if (!base) throw new Error('API_BASE missing')
    return base
  }

  async function getMe(): Promise<MeResponse> {
    const base = getApiBase()
    const token = await getAccessToken()
    return await $fetch<MeResponse>(`${base}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async function deleteMe(): Promise<void> {
    const base = getApiBase()
    const token = await getAccessToken()
    await $fetch(`${base}/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  return { getMe, deleteMe }
}

