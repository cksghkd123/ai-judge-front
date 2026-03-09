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

function getAuthHeaders(): Record<string, string> {
  const { session } = useAuth()
  const token = session.value?.access_token
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export function useCaseApi() {
  const baseUrl = getBaseUrl()
  const hasApi = computed(() => Boolean(baseUrl))

  async function request<T>(
    method: string,
    path: string,
    opts: { body?: object; query?: Record<string, string> } = {}
  ): Promise<T> {
    const url = `${baseUrl}${path}`
    const headers: Record<string, string> = {
      ...getAuthHeaders(),
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

  async function addEvidence(
    caseId: string,
    form: {
      type: 'text' | 'chat' | 'photo'
      content?: string
      description?: string
      file?: File
    }
  ): Promise<EvidenceResponse> {
    const url = `${baseUrl}${PREFIX}/cases/${caseId}/evidence`
    const headers: Record<string, string> = {
      ...getAuthHeaders(),
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
    addEvidence,
    completeEvidence,
    listMyEvidence,
    listOpponentEvidence,
    getEvidenceImageUrl,
  }
}
