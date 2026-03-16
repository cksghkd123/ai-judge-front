export type CaseStatus = 'pending' | 'active' | 'rebutting' | 'judging' | 'completed'

export interface FaultRatio {
  plaintiff: number
  defendant: number
}

export type EvidenceType = 'text' | 'chat' | 'photo'

export type EvidenceSubmittedBy = 'plaintiff' | 'defendant'

export interface Evidence {
  id: string
  type: EvidenceType
  content: string | null
  file_path?: string | null
  submittedBy: EvidenceSubmittedBy
}

export interface EvidenceRebuttal {
  accepted: boolean
  rebuttal?: string
}

export interface CaseData {
  id: string
  title: string
  complaintSummary: string
  issue: string
  status: CaseStatus
  createdAt: string
  plaintiffId: string
  defendantId?: string
  inviteToken: string
  opponentIdentifier?: string
  senderName?: string
  senderJobs?: string
  senderAddress?: string
  plaintiffEvidence: Evidence[]
  defendantEvidence: Evidence[]
  plaintiffEvidenceComplete: boolean
  defendantEvidenceComplete: boolean
  plaintiffRebuttals: Record<string, EvidenceRebuttal>
  defendantRebuttals: Record<string, EvidenceRebuttal>
  plaintiffRebuttalComplete: boolean
  defendantRebuttalComplete: boolean
  verdictText?: string
  faultRatio?: FaultRatio
  judgeAgentId?: string
}

const STORAGE_KEY = 'ai-judge-cases'

function migrateFromLegacy(data: Record<string, unknown>): Record<string, CaseData> {
  const result: Record<string, CaseData> = {}
  const statusMap: Record<string, CaseStatus> = {
    invite: 'pending',
    matched: 'active',
    plaintiff_submitted: 'active',
    defendant_submitted: 'active',
    both_submitted: 'rebutting',
    judging: 'judging',
    verdict: 'completed',
  }
  for (const [id, raw] of Object.entries(data)) {
    const c = raw as Record<string, unknown>
    if (!c || typeof c !== 'object' || !c.id) continue
    const plaintiffSubmission = c.plaintiffSubmission as string | undefined
    const defendantSubmission = c.defendantSubmission as string | undefined
    const plaintiffEvidence: Evidence[] = []
    const defendantEvidence: Evidence[] = []
    if (plaintiffSubmission) {
      plaintiffEvidence.push({
        id: crypto.randomUUID(),
        type: 'text',
        content: plaintiffSubmission,
        submittedBy: 'plaintiff',
      })
    }
    if (defendantSubmission) {
      defendantEvidence.push({
        id: crypto.randomUUID(),
        type: 'text',
        content: defendantSubmission,
        submittedBy: 'defendant',
      })
    }
    const oldStatus = (c.status as string) || 'pending'
    result[id as string] = {
      id: c.id as string,
      title: (c.title as string) || '',
      complaintSummary: (c.complaintSummary as string) || '',
      issue: (c.issue as string) || '',
      status: statusMap[oldStatus] ?? (oldStatus as CaseStatus),
      createdAt: (c.createdAt as string) || new Date().toISOString(),
      plaintiffId: c.plaintiffId as string,
      defendantId: c.defendantId as string | undefined,
      inviteToken: (c.inviteToken as string) || crypto.randomUUID(),
      opponentIdentifier: c.opponentIdentifier as string | undefined,
      plaintiffEvidence: (c.plaintiffEvidence as Evidence[]) ?? plaintiffEvidence,
      defendantEvidence: (c.defendantEvidence as Evidence[]) ?? defendantEvidence,
      plaintiffEvidenceComplete:
        (c.plaintiffEvidenceComplete as boolean) ?? plaintiffEvidence.length > 0,
      defendantEvidenceComplete:
        (c.defendantEvidenceComplete as boolean) ?? defendantEvidence.length > 0,
      plaintiffRebuttals:
        (c.plaintiffRebuttals as Record<string, EvidenceRebuttal>) ??
        (c.plaintiffReviews as Record<string, EvidenceRebuttal>) ??
        {},
      defendantRebuttals:
        (c.defendantRebuttals as Record<string, EvidenceRebuttal>) ??
        (c.defendantReviews as Record<string, EvidenceRebuttal>) ??
        {},
      plaintiffRebuttalComplete:
        (c.plaintiffRebuttalComplete as boolean) ?? (c.plaintiffReviewComplete as boolean) ?? false,
      defendantRebuttalComplete:
        (c.defendantRebuttalComplete as boolean) ?? (c.defendantReviewComplete as boolean) ?? false,
      verdictText: c.verdictText as string | undefined,
      faultRatio: c.faultRatio as FaultRatio | undefined,
    }
  }
  return result
}

function loadFromStorage(): Record<string, CaseData> {
  if (import.meta.client && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        const hasNewSchema = Object.values(parsed).some(
          (c) =>
            c &&
            typeof c === 'object' &&
            'inviteToken' in c &&
            Array.isArray((c as Record<string, unknown>).plaintiffEvidence),
        )
        if (hasNewSchema) {
          const normalized: Record<string, CaseData> = {}
          for (const [k, v] of Object.entries(parsed)) {
            const item = v as Record<string, unknown>
            if (!item || typeof item !== 'object' || !item.id) continue
            normalized[k] = {
              ...item,
              issue: (item.issue as string) ?? '',
              inviteToken: (item.inviteToken as string) ?? crypto.randomUUID(),
              plaintiffEvidence: Array.isArray(item.plaintiffEvidence)
                ? (item.plaintiffEvidence as Evidence[])
                : [],
              defendantEvidence: Array.isArray(item.defendantEvidence)
                ? (item.defendantEvidence as Evidence[])
                : [],
              plaintiffEvidenceComplete: (item.plaintiffEvidenceComplete as boolean) ?? false,
              defendantEvidenceComplete: (item.defendantEvidenceComplete as boolean) ?? false,
              plaintiffRebuttals:
                (item.plaintiffRebuttals as Record<string, EvidenceRebuttal>) ??
                (item.plaintiffReviews as Record<string, EvidenceRebuttal>) ??
                {},
              defendantRebuttals:
                (item.defendantRebuttals as Record<string, EvidenceRebuttal>) ??
                (item.defendantReviews as Record<string, EvidenceRebuttal>) ??
                {},
              plaintiffRebuttalComplete:
                (item.plaintiffRebuttalComplete as boolean) ??
                (item.plaintiffReviewComplete as boolean) ??
                false,
              defendantRebuttalComplete:
                (item.defendantRebuttalComplete as boolean) ??
                (item.defendantReviewComplete as boolean) ??
                false,
            } as CaseData
          }
          return normalized
        }
        return migrateFromLegacy(parsed)
      }
    } catch {
      // ignore
    }
  }
  return {}
}

function saveToStorage(cases: Record<string, CaseData>) {
  if (import.meta.client && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
    } catch {
      // ignore
    }
  }
}

export type CaseListItemApi = {
  id: string
  title: string
  status: string
  created_at: string
  my_role: 'creator' | 'counterparty'
}

function isApiMode(): boolean {
  const config = useRuntimeConfig()
  return Boolean((config.public.apiBase as string)?.replace(/\/$/, ''))
}

function mapEvidenceResponseToEvidence(
  r: {
    id: string
    type: string
    content: string | null
    file_path: string | null
  },
  submittedBy: EvidenceSubmittedBy,
): Evidence {
  return {
    id: r.id,
    type: r.type as EvidenceType,
    content: r.content ?? null,
    file_path: r.file_path ?? undefined,
    submittedBy,
  }
}

export function useCaseStore() {
  const cases = useState<Record<string, CaseData>>('case-store', () => ({}))
  const apiCaseList = useState<CaseListItemApi[]>('case-api-list', () => [])

  onMounted(() => {
    if (isApiMode()) return
    const stored = loadFromStorage()
    if (Object.keys(stored).length > 0) {
      cases.value = { ...cases.value, ...stored }
    }
  })

  watch(
    cases,
    (val) => {
      if (isApiMode()) return
      saveToStorage(val)
    },
    { deep: true },
  )

  async function createCase(payload: {
    title: string
    complaintSummary: string
    issue: string
    plaintiffId: string
    opponentIdentifier?: string
    judgeAgentId?: string | null
  }): Promise<CaseData> {
    if (isApiMode()) {
      const api = useCaseApi()
      const res = await api.createCase({
        title: payload.title,
        description: payload.complaintSummary,
        issue: payload.issue,
        judge_agent_id: payload.judgeAgentId ?? undefined,
      })
      const caseData: CaseData = {
        id: res.id,
        title: res.title,
        complaintSummary: res.description,
        issue: res.issue,
        status: res.status as CaseStatus,
        createdAt: res.created_at,
        plaintiffId: res.created_by,
        inviteToken: res.invite_token,
        judgeAgentId: res.judge_agent_id,
        plaintiffEvidence: [],
        defendantEvidence: [],
        plaintiffEvidenceComplete: false,
        defendantEvidenceComplete: false,
        plaintiffRebuttals: {},
        defendantRebuttals: {},
        plaintiffRebuttalComplete: false,
        defendantRebuttalComplete: false,
      }
      cases.value = { ...cases.value, [res.id]: caseData }
      return caseData
    }
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const inviteToken = crypto.randomUUID()
    const caseData: CaseData = {
      id,
      title: payload.title,
      complaintSummary: payload.complaintSummary,
      issue: payload.issue,
      status: 'pending',
      createdAt: now,
      plaintiffId: payload.plaintiffId,
      inviteToken,
      opponentIdentifier: payload.opponentIdentifier,
      plaintiffEvidence: [],
      defendantEvidence: [],
      plaintiffEvidenceComplete: false,
      defendantEvidenceComplete: false,
      plaintiffRebuttals: {},
      defendantRebuttals: {},
      plaintiffRebuttalComplete: false,
      defendantRebuttalComplete: false,
    }
    cases.value = { ...cases.value, [id]: caseData }
    return caseData
  }

  function getCase(id: string): CaseData | undefined {
    return cases.value[id]
  }

  function updateCase(id: string, updates: Partial<CaseData>) {
    const existing = cases.value[id]
    if (!existing) return
    cases.value = {
      ...cases.value,
      [id]: { ...existing, ...updates },
    }
  }

  async function joinCase(
    caseId: string,
    inviteToken: string,
    _defendantId: string,
  ): Promise<boolean> {
    if (isApiMode()) {
      const api = useCaseApi()
      await api.joinCase({ case_id: caseId, invite_token: inviteToken })
      return true
    }
    const c = cases.value[caseId]
    if (!c || c.inviteToken !== inviteToken || c.defendantId) return false
    updateCase(caseId, { defendantId: _defendantId, status: 'active' })
    return true
  }

  async function fetchCasesFromApi(): Promise<void> {
    if (!isApiMode()) return
    const api = useCaseApi()
    const list = await api.listCases()
    apiCaseList.value = list
  }

  async function fetchCaseFromApi(caseId: string): Promise<CaseData | undefined> {
    if (!isApiMode()) return getCase(caseId)
    const api = useCaseApi()
    const detail = await api.getCaseDetail(caseId)

    // pending이면 counterpart_evidences가 400이라서 증거 API 호출 생략
    if (detail.status === 'pending') {
      const caseData: CaseData = {
        id: detail.id,
        title: detail.title,
        complaintSummary: detail.description,
        issue: detail.issue,
        status: detail.status as CaseStatus,
        createdAt: detail.created_at,
        plaintiffId: detail.created_by,
        defendantId: detail.counterpart_id ?? undefined,
        inviteToken: detail.invite_token,
        opponentIdentifier: undefined,
        senderName: detail.sender_name ?? undefined,
        senderJobs: detail.sender_jobs ?? undefined,
        senderAddress: detail.sender_address ?? undefined,
        plaintiffEvidence: [],
        defendantEvidence: [],
        plaintiffEvidenceComplete: false,
        defendantEvidenceComplete: false,
        plaintiffRebuttals: {},
        defendantRebuttals: {},
        plaintiffRebuttalComplete: detail.creator_rebuttal_complete ?? false,
        defendantRebuttalComplete: detail.counterparty_rebuttal_complete ?? false,
        judgeAgentId: detail.judge_agent_id,
      }
      cases.value = { ...cases.value, [caseId]: caseData }
      return caseData
    }

    const [myEvidence, counterpartEvidence] = await Promise.all([
      api.listMyEvidence(caseId),
      api.listCounterpartEvidence(caseId),
    ])
    const plaintiffId = detail.created_by
    const defendantId = detail.counterpart_id ?? undefined
    const mySubmittedBy: EvidenceSubmittedBy =
      detail.my_role === 'creator' ? 'plaintiff' : 'defendant'
    const oppSubmittedBy: EvidenceSubmittedBy =
      detail.my_role === 'creator' ? 'defendant' : 'plaintiff'
    const plaintiffEvidence = (detail.my_role === 'creator' ? myEvidence : counterpartEvidence).map(
      (r) => mapEvidenceResponseToEvidence(r, 'plaintiff'),
    )
    const defendantEvidence = (detail.my_role === 'creator' ? counterpartEvidence : myEvidence).map(
      (r) => mapEvidenceResponseToEvidence(r, 'defendant'),
    )
    const caseData: CaseData = {
      id: detail.id,
      title: detail.title,
      complaintSummary: detail.description,
      issue: detail.issue,
      status: detail.status as CaseStatus,
      createdAt: detail.created_at,
      plaintiffId,
      defendantId,
      inviteToken: detail.invite_token,
      opponentIdentifier: undefined,
      senderName: detail.sender_name ?? undefined,
      senderJobs: detail.sender_jobs ?? undefined,
      senderAddress: detail.sender_address ?? undefined,
      plaintiffEvidence,
      defendantEvidence,
      plaintiffEvidenceComplete: detail.creator_evidence_complete,
      defendantEvidenceComplete: detail.counterparty_evidence_complete,
      plaintiffRebuttals: {},
      defendantRebuttals: {},
      plaintiffRebuttalComplete: detail.creator_rebuttal_complete ?? false,
      defendantRebuttalComplete: detail.counterparty_rebuttal_complete ?? false,
      judgeAgentId: detail.judge_agent_id,
    }
    cases.value = { ...cases.value, [caseId]: caseData }
    return caseData
  }

  /** 초대 링크에서 내용증명 요약만 조회 (참여 전). 인증 없는 preview API 사용. */
  async function fetchCasePreviewFromApi(
    caseId: string,
    inviteToken: string,
  ): Promise<CaseData | undefined> {
    if (!isApiMode()) return getCase(caseId)
    const api = useCaseApi()
    try {
      const preview = await api.getCasePreview(caseId)
      const caseData: CaseData = {
        id: preview.id,
        title: preview.title,
        complaintSummary: preview.description,
        issue: preview.issue,
        status: preview.status as CaseStatus,
        createdAt: preview.created_at,
        plaintiffId: '',
        defendantId: undefined,
        inviteToken,
        opponentIdentifier: undefined,
        senderName: preview.sender_name ?? undefined,
        senderJobs: preview.sender_jobs ?? undefined,
        senderAddress: preview.sender_address ?? undefined,
        plaintiffEvidence: [],
        defendantEvidence: [],
        plaintiffEvidenceComplete: false,
        defendantEvidenceComplete: false,
        plaintiffRebuttals: {},
        defendantRebuttals: {},
        plaintiffRebuttalComplete: false,
        defendantRebuttalComplete: false,
      }
      cases.value = { ...cases.value, [caseId]: caseData }
      return caseData
    } catch {
      return undefined
    }
  }

  async function addEvidence(caseId: string, evidence: Evidence, file?: File): Promise<void> {
    const c = cases.value[caseId]
    if (!c) return
    if (isApiMode()) {
      const api = useCaseApi()
      const form: {
        type: 'text' | 'chat' | 'photo'
        content?: string
        file?: File
      } = {
        type: evidence.type,
      }
      if (evidence.type === 'text') form.content = evidence.content ?? undefined
      else form.content = evidence.content ?? undefined
      if (file) form.file = file
      const res = await api.addEvidence(caseId, form)
      const mapped = mapEvidenceResponseToEvidence(res, evidence.submittedBy)
      if (evidence.submittedBy === 'plaintiff') {
        updateCase(caseId, { plaintiffEvidence: [...c.plaintiffEvidence, mapped] })
      } else {
        updateCase(caseId, { defendantEvidence: [...c.defendantEvidence, mapped] })
      }
      return
    }
    if (evidence.submittedBy === 'plaintiff') {
      updateCase(caseId, {
        plaintiffEvidence: [...c.plaintiffEvidence, evidence],
      })
    } else {
      updateCase(caseId, {
        defendantEvidence: [...c.defendantEvidence, evidence],
      })
    }
  }

  function removeEvidence(caseId: string, submittedBy: EvidenceSubmittedBy, evidenceId: string) {
    const c = cases.value[caseId]
    if (!c) return
    if (submittedBy === 'plaintiff') {
      updateCase(caseId, {
        plaintiffEvidence: c.plaintiffEvidence.filter((e) => e.id !== evidenceId),
      })
    } else {
      updateCase(caseId, {
        defendantEvidence: c.defendantEvidence.filter((e) => e.id !== evidenceId),
      })
    }
  }

  async function setEvidenceComplete(
    caseId: string,
    submittedBy: EvidenceSubmittedBy,
  ): Promise<void> {
    const c = cases.value[caseId]
    if (!c) return
    if (isApiMode()) {
      const api = useCaseApi()
      await api.completeEvidence(caseId)
      await fetchCaseFromApi(caseId)
      return
    }
    if (submittedBy === 'plaintiff') {
      updateCase(caseId, { plaintiffEvidenceComplete: true })
    } else {
      updateCase(caseId, { defendantEvidenceComplete: true })
    }
    const next = cases.value[caseId]
    if (next?.plaintiffEvidenceComplete && next?.defendantEvidenceComplete) {
      updateCase(caseId, { status: 'rebutting' })
    }
  }

  async function setRebuttal(
    caseId: string,
    submittedBy: EvidenceSubmittedBy,
    evidenceId: string,
    rebuttal: EvidenceRebuttal,
  ): Promise<void> {
    const c = cases.value[caseId]
    if (!c) return
    if (isApiMode()) {
      const api = useCaseApi()
      await api.rebutEvidence(caseId, evidenceId, {
        accepted: rebuttal.accepted,
        rebuttal: rebuttal.rebuttal ?? null,
      })
    }
    if (submittedBy === 'plaintiff') {
      updateCase(caseId, {
        plaintiffRebuttals: { ...c.plaintiffRebuttals, [evidenceId]: rebuttal },
      })
    } else {
      updateCase(caseId, {
        defendantRebuttals: { ...c.defendantRebuttals, [evidenceId]: rebuttal },
      })
    }
  }

  async function setRebuttalComplete(
    caseId: string,
    submittedBy: EvidenceSubmittedBy,
  ): Promise<void> {
    const c = cases.value[caseId]
    if (!c) return
    if (isApiMode()) {
      const api = useCaseApi()
      await api.completeRebuttal(caseId)
      await fetchCaseFromApi(caseId)
      return
    }
    if (submittedBy === 'plaintiff') {
      updateCase(caseId, { plaintiffRebuttalComplete: true })
    } else {
      updateCase(caseId, { defendantRebuttalComplete: true })
    }
    const next = cases.value[caseId]
    if (next?.plaintiffRebuttalComplete && next?.defendantRebuttalComplete) {
      updateCase(caseId, { status: 'judging' })
    }
  }

  return {
    cases,
    apiCaseList,
    createCase,
    getCase,
    updateCase,
    joinCase,
    addEvidence,
    removeEvidence,
    setEvidenceComplete,
    setRebuttal,
    setRebuttalComplete,
    isApiMode,
    fetchCasesFromApi,
    fetchCaseFromApi,
    fetchCasePreviewFromApi,
  }
}
