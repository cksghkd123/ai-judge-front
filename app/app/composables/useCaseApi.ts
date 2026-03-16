/**
 * Judge 백엔드 API 클라이언트.
 * Supabase 세션의 access_token을 Bearer로 보냅니다.
 */

export interface CreateCaseRequest {
  title: string
  description: string
  issue: string
  judge_agent_id?: string | null
}

export interface CreateCaseResponse {
  id: string
  title: string
  description: string
  issue: string
  status: string
  claimant_id: string
  created_at: string
  invite_token: string
  judge_agent_id: string
}

export interface JudgeAgent {
  id: string
  name: string
  /** 판사 이미지 URL (카로셀 등 표시용) */
  judge_image?: string
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
  my_role: 'claimant' | 'respondent'
}

export interface CaseDetailResponse {
  id: string
  title: string
  description: string
  issue: string
  status: string
  claimant_id: string
  respondent_id: string | null
  my_role: 'claimant' | 'respondent'
  created_at: string
  invite_token: string
  sender_name?: string
  sender_jobs?: string | null
  sender_address?: string | null
  claimant_evidence_complete: boolean
  respondent_evidence_complete: boolean
  claimant_rebuttal_complete?: boolean
  respondent_rebuttal_complete?: boolean
  judge_agent_id?: string
}

/** 상대 증거 1건에 대한 반박 제출/수정 요청 */
export interface RebuttalRequest {
  accepted: boolean
  rebuttal?: string | null
}

export interface RebuttalResponse {
  id: string
  evidence_id: string
  rebutter_user_id: string
  accepted: boolean
  rebuttal: string | null
  created_at: string
}

export interface CaseResultsResponse {
  case_id: string
  judgment_content: string | null
  fault_ratio_claimant: number | null
  fault_ratio_respondent: number | null
  judged_at: string | null
  status: string
}

/** 사건 참여 전 미리보기용 (인증 불필요). GET /cases/preview/{case_id} */
export interface CasePreviewResponse {
  id: string
  title: string
  description: string
  issue: string
  status: string
  created_at: string
  sender_name?: string
  sender_jobs?: string | null
  sender_address?: string | null
}

export interface EvidenceResponse {
  id: string
  case_id: string
  user_id: string
  type: 'text' | 'chat' | 'photo'
  content: string | null
  file_path: string | null
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
    const {
      data: { session },
    } = await supabase.auth.getSession()
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

  async function getJudgeAgents(): Promise<JudgeAgent[]> {
    const list = await request<Array<Record<string, string>>>('GET', `${PREFIX}/agents`)
    return list.map((item) => ({
      id: item.id ?? '',
      name: item.name ?? item.id ?? '',
      judge_image: item.judge_image || undefined,
    }))
  }

  async function createCase(body: CreateCaseRequest): Promise<CreateCaseResponse> {
    return request<CreateCaseResponse>('POST', `${PREFIX}/case`, { body })
  }

  async function joinCase(body: JoinCaseRequest): Promise<void> {
    return request<void>('POST', `${PREFIX}/case/join`, { body })
  }

  async function listCases(): Promise<CaseListItem[]> {
    return request<CaseListItem[]>('GET', `${PREFIX}/cases`)
  }

  async function getCaseDetail(caseId: string): Promise<CaseDetailResponse> {
    return request<CaseDetailResponse>('GET', `${PREFIX}/case/${caseId}`)
  }

  /** 참여 전 미리보기. 인증 없이 호출 (pending 사건만 조회 가능) */
  async function getCasePreview(caseId: string): Promise<CasePreviewResponse> {
    const url = `${baseUrl}${PREFIX}/case/preview/${caseId}`
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
      file?: File
    },
  ): Promise<EvidenceResponse> {
    const url = `${baseUrl}${PREFIX}/case/${caseId}/evidence`
    const authHeaders = await getAuthHeaders()
    const headers: Record<string, string> = {
      ...authHeaders,
    }
    const body = new FormData()
    body.append('type', form.type)
    if (form.content != null) body.append('content', form.content)
    if (form.file) body.append('file', form.file)

    return $fetch<EvidenceResponse>(url, {
      method: 'POST',
      headers,
      body,
    })
  }

  async function completeEvidence(caseId: string): Promise<void> {
    return request<void>('POST', `${PREFIX}/case/${caseId}/evidence/complete`)
  }

  async function listMyEvidence(caseId: string): Promise<EvidenceResponse[]> {
    return request<EvidenceResponse[]>('GET', `${PREFIX}/case/${caseId}/my-evidences`)
  }

  async function listCounterpartyEvidence(caseId: string): Promise<EvidenceResponse[]> {
    return request<EvidenceResponse[]>('GET', `${PREFIX}/case/${caseId}/counterpart-evidences`)
  }

  /** 상대 증거 1건에 대한 반박 제출/수정. status=rebutting일 때만 가능 */
  async function rebutEvidence(
    caseId: string,
    evidenceId: string,
    body: RebuttalRequest,
  ): Promise<RebuttalResponse> {
    return request<RebuttalResponse>(
      'POST',
      `${PREFIX}/case/${caseId}/evidence/${evidenceId}/rebut`,
      {
        body: { accepted: body.accepted, rebuttal: body.rebuttal ?? null },
      },
    )
  }

  /** 내 반박 완료 선언. 양측 모두 완료 시 status=judging */
  async function completeRebuttal(caseId: string): Promise<void> {
    return request<void>('POST', `${PREFIX}/case/${caseId}/rebuttal/complete`)
  }

  /** 사건 판단(결과) 조회. 판결문/과실비율 등 */
  async function getCaseResults(caseId: string): Promise<CaseResultsResponse> {
    return request<CaseResultsResponse>('GET', `${PREFIX}/case/${caseId}/results`)
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
    getJudgeAgents,
    createCase,
    joinCase,
    listCases,
    getCaseDetail,
    getCasePreview,
    addEvidence,
    completeEvidence,
    listMyEvidence,
    listCounterpartyEvidence,
    rebutEvidence,
    completeRebuttal,
    getCaseResults,
    getEvidenceImageUrl,
  }
}
