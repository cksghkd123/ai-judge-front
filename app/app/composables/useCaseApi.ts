/**
 * Judge 백엔드 API 클라이언트.
 * Supabase 세션의 access_token을 Bearer로 보냅니다.
 */

export interface CreateCaseRequest {
  title: string
  description: string
  issue: string
}

export interface CreateCaseResponse {
  id: string
  title: string
  description: string
  issue: string
  status: string
  created_by: string
  created_at: string
  invite_token: string
}

export interface JoinCaseRequest {
  case_id: string
  invite_token: string
}

export interface CaseListItem {
  id: string
  title: string
  status: string
  created_at: string
  my_role: 'creator' | 'counterparty'
}

export interface CaseDetailResponse {
  id: string
  title: string
  description: string
  issue: string
  status: string
  created_by: string
  counterpart_id: string | null
  my_role: 'creator' | 'counterparty'
  created_at: string
}

/** 사건 참여 전 미리보기용 (인증 불필요). GET /cases/preview/{case_id} */
export interface CasePreviewResponse {
  id: string
  title: string
  description: string
  issue: string
  status: string
  created_at: string
}

export interface EvidenceResponse {
  id: string
  case_id: string
  user_id: string
  type: 'text' | 'chat' | 'photo'
  content: string | null
  file_path: string | null
  description: string | null
  created_at: string
}

const PREFIX = '/judge'

function getBaseUrl(): string {
  const config = useRuntimeConfig()
  const base = (config.public.apiBase as string) || ''
  return base.replace(/\/$/, '')
}

export function useCaseApi() {
  const baseUrl = getBaseUrl()
  const hasApi = computed(() => Boolean(baseUrl))
  const supabase = useNuxtApp().$supabase

  /** 요청 시점에 세션 조회해 Bearer 토큰 전달 (useAuth 세션보다 쿠키 기준이 안정적) */
  async function getAuthHeaders(): Promise<Record<string, string>> {
    if (!supabase) return {}
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }

  async function request<T>(
    method: string,
    path: string,
    opts: { body?: object; query?: Record<string, string> } = {},
  ): Promise<T> {
    const url = `${baseUrl}${path}`
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...authHeaders,
      'Content-Type': 'application/json',
    }
    return $fetch<T>(url, {
      method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      headers,
      body: opts.body,
      query: opts.query,
    })
  }

  async function createCase(body: CreateCaseRequest): Promise<CreateCaseResponse> {
    return request<CreateCaseResponse>('POST', `${PREFIX}/cases`, { body })
  }

  async function joinCase(body: JoinCaseRequest): Promise<void> {
    return request<void>('POST', `${PREFIX}/cases/join`, { body })
  }

  async function listCases(): Promise<CaseListItem[]> {
    return request<CaseListItem[]>('GET', `${PREFIX}/cases`)
  }

  async function getCaseDetail(caseId: string): Promise<CaseDetailResponse> {
    return request<CaseDetailResponse>('GET', `${PREFIX}/cases/${caseId}`)
  }

  /** 참여 전 미리보기. 인증 없이 호출 (pending 사건만 조회 가능) */
  async function getCasePreview(caseId: string): Promise<CasePreviewResponse> {
    const url = `${baseUrl}${PREFIX}/cases/preview/${caseId}`
    return $fetch<CasePreviewResponse>(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async function addEvidence(
    caseId: string,
    form: {
      type: 'text' | 'chat' | 'photo'
      content?: string
      description?: string
      file?: File
    },
  ): Promise<EvidenceResponse> {
    const url = `${baseUrl}${PREFIX}/cases/${caseId}/evidence`
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...authHeaders,
    }
    const body = new FormData()
    body.append('type', form.type)
    if (form.content != null) body.append('content', form.content)
    if (form.description != null) body.append('description', form.description)
    if (form.file) body.append('file', form.file)

    return $fetch<EvidenceResponse>(url, {
      method: 'POST',
      headers,
      body,
    })
  }

  async function completeEvidence(caseId: string): Promise<void> {
    return request<void>('POST', `${PREFIX}/cases/${caseId}/evidence/complete`)
  }

  async function listMyEvidence(caseId: string): Promise<EvidenceResponse[]> {
    return request<EvidenceResponse[]>('GET', `${PREFIX}/cases/${caseId}/evidence`)
  }

  /** 상대방 증거 목록. 백엔드에 엔드포인트 없으면 404 → [] 반환 */
  async function listOpponentEvidence(caseId: string): Promise<EvidenceResponse[]> {
    try {
      return await request<EvidenceResponse[]>('GET', `${PREFIX}/cases/${caseId}/evidence/opponent`)
    } catch {
      return []
    }
  }

  /** 증거 이미지 URL. file_path가 상대 경로일 때 Supabase storage public URL로 변환 */
  function getEvidenceImageUrl(contentOrPath: string | null | undefined): string {
    if (!contentOrPath) return ''
    if (contentOrPath.startsWith('http') || contentOrPath.startsWith('data:')) return contentOrPath
    const config = useRuntimeConfig()
    const base = (config.public.supabaseUrl as string) || ''
    const bucket = (config.public.supabaseStorageBucket as string) || ''
    if (!base || !bucket) return contentOrPath
    return `${base.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${contentOrPath}`
  }

  return {
    hasApi,
    createCase,
    joinCase,
    listCases,
    getCaseDetail,
    getCasePreview,
    addEvidence,
    completeEvidence,
    listMyEvidence,
    listOpponentEvidence,
    getEvidenceImageUrl,
  }
}
