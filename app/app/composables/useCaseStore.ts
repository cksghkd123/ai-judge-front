export type CaseStatus = 'pending' | 'active' | 'rebutting' | 'judging' | 'completed'

export interface FaultRatio {
  claimant: number
  respondent: number
}

export type EvidenceType = 'text' | 'chat' | 'photo'

export type EvidenceSubmittedBy = 'claimant' | 'respondent'

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
  claimantId: string
  respondentId?: string
  inviteToken: string
  opponentIdentifier?: string
  senderName?: string
  senderJobs?: string
  senderAddress?: string
  claimantEvidence: Evidence[]
  respondentEvidence: Evidence[]
  claimantEvidenceComplete: boolean
  respondentEvidenceComplete: boolean
  claimantRebuttals: Record<string, EvidenceRebuttal>
  respondentRebuttals: Record<string, EvidenceRebuttal>
  claimantRebuttalComplete: boolean
  respondentRebuttalComplete: boolean
  verdictText?: string
  faultRatio?: FaultRatio
  judgeAgentId?: string
}

const STORAGE_KEY = 'ai-judge-cases'

function normalizeFaultRatio(
  r: FaultRatio | { plaintiff?: number; defendant?: number } | undefined,
): FaultRatio | undefined {
  if (!r || typeof r !== 'object') return undefined
  const claimant = (r as FaultRatio).claimant ?? (r as { plaintiff?: number }).plaintiff
  const respondent = (r as FaultRatio).respondent ?? (r as { defendant?: number }).defendant
  if (claimant != null && respondent != null) return { claimant, respondent }
  return undefined
}

function normalizeEvidenceList(list: unknown): Evidence[] {
  if (!Array.isArray(list)) return []
  return list.map((e: Record<string, unknown>) => ({
    ...e,
    submittedBy: (e.submittedBy === 'claimant' || e.submittedBy === 'respondent'
      ? e.submittedBy
      : e.submittedBy === 'plaintiff'
        ? 'claimant'
        : 'respondent') as EvidenceSubmittedBy,
  })) as Evidence[]
}

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
    const claimantSubmission = (c.plaintiffSubmission ?? c.claimantSubmission) as string | undefined
    const respondentSubmission = (c.defendantSubmission ?? c.respondentSubmission) as
      | string
      | undefined
    const claimantEvidence: Evidence[] = []
    const respondentEvidence: Evidence[] = []
    if (claimantSubmission) {
      claimantEvidence.push({
        id: crypto.randomUUID(),
        type: 'text',
        content: claimantSubmission,
        submittedBy: 'claimant',
      })
    }
    if (respondentSubmission) {
      respondentEvidence.push({
        id: crypto.randomUUID(),
        type: 'text',
        content: respondentSubmission,
        submittedBy: 'respondent',
      })
    }
    const oldStatus = (c.status as string) || 'pending'
    const legacyPl = c.plaintiffEvidence ?? c.claimantEvidence
    const legacyDe = c.defendantEvidence ?? c.respondentEvidence
    result[id as string] = {
      id: c.id as string,
      title: (c.title as string) || '',
      complaintSummary: (c.complaintSummary as string) || '',
      issue: (c.issue as string) || '',
      status: statusMap[oldStatus] ?? (oldStatus as CaseStatus),
      createdAt: (c.createdAt as string) || new Date().toISOString(),
      claimantId: (c.claimantId ?? c.plaintiffId) as string,
      respondentId: (c.respondentId ?? c.defendantId) as string | undefined,
      inviteToken: (c.inviteToken as string) || crypto.randomUUID(),
      opponentIdentifier: c.opponentIdentifier as string | undefined,
      claimantEvidence: legacyPl != null ? normalizeEvidenceList(legacyPl) : claimantEvidence,
      respondentEvidence: legacyDe != null ? normalizeEvidenceList(legacyDe) : respondentEvidence,
      claimantEvidenceComplete:
        (c.claimantEvidenceComplete as boolean) ??
        (c.plaintiffEvidenceComplete as boolean) ??
        claimantEvidence.length > 0,
      respondentEvidenceComplete:
        (c.respondentEvidenceComplete as boolean) ??
        (c.defendantEvidenceComplete as boolean) ??
        respondentEvidence.length > 0,
      claimantRebuttals:
        (c.claimantRebuttals as Record<string, EvidenceRebuttal>) ??
        (c.plaintiffRebuttals as Record<string, EvidenceRebuttal>) ??
        (c.plaintiffReviews as Record<string, EvidenceRebuttal>) ??
        {},
      respondentRebuttals:
        (c.respondentRebuttals as Record<string, EvidenceRebuttal>) ??
        (c.defendantRebuttals as Record<string, EvidenceRebuttal>) ??
        (c.defendantReviews as Record<string, EvidenceRebuttal>) ??
        {},
      claimantRebuttalComplete:
        (c.claimantRebuttalComplete as boolean) ??
        (c.plaintiffRebuttalComplete as boolean) ??
        (c.plaintiffReviewComplete as boolean) ??
        false,
      respondentRebuttalComplete:
        (c.respondentRebuttalComplete as boolean) ??
        (c.defendantRebuttalComplete as boolean) ??
        (c.defendantReviewComplete as boolean) ??
        false,
      verdictText: c.verdictText as string | undefined,
      faultRatio: normalizeFaultRatio(c.faultRatio as FaultRatio | undefined),
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
            (Array.isArray((c as Record<string, unknown>).claimantEvidence) ||
              Array.isArray((c as Record<string, unknown>).plaintiffEvidence)),
        )
        if (hasNewSchema) {
          const normalized: Record<string, CaseData> = {}
          for (const [k, v] of Object.entries(parsed)) {
            const item = v as Record<string, unknown>
            if (!item || typeof item !== 'object' || !item.id) continue
            const claimantEv = item.claimantEvidence ?? item.plaintiffEvidence
            const respondentEv = item.respondentEvidence ?? item.defendantEvidence
            normalized[k] = {
              ...item,
              issue: (item.issue as string) ?? '',
              inviteToken: (item.inviteToken as string) ?? crypto.randomUUID(),
              claimantId: (item.claimantId ?? item.plaintiffId) as string,
              respondentId: (item.respondentId ?? item.defendantId) as string | undefined,
              claimantEvidence: normalizeEvidenceList(claimantEv),
              respondentEvidence: normalizeEvidenceList(respondentEv),
              claimantEvidenceComplete:
                (item.claimantEvidenceComplete as boolean) ??
                (item.plaintiffEvidenceComplete as boolean) ??
                false,
              respondentEvidenceComplete:
                (item.respondentEvidenceComplete as boolean) ??
                (item.defendantEvidenceComplete as boolean) ??
                false,
              claimantRebuttals:
                (item.claimantRebuttals as Record<string, EvidenceRebuttal>) ??
                (item.plaintiffRebuttals as Record<string, EvidenceRebuttal>) ??
                (item.plaintiffReviews as Record<string, EvidenceRebuttal>) ??
                {},
              respondentRebuttals:
                (item.respondentRebuttals as Record<string, EvidenceRebuttal>) ??
                (item.defendantRebuttals as Record<string, EvidenceRebuttal>) ??
                (item.defendantReviews as Record<string, EvidenceRebuttal>) ??
                {},
              claimantRebuttalComplete:
                (item.claimantRebuttalComplete as boolean) ??
                (item.plaintiffRebuttalComplete as boolean) ??
                (item.plaintiffReviewComplete as boolean) ??
                false,
              respondentRebuttalComplete:
                (item.respondentRebuttalComplete as boolean) ??
                (item.defendantRebuttalComplete as boolean) ??
                (item.defendantReviewComplete as boolean) ??
                false,
              faultRatio: normalizeFaultRatio(item.faultRatio as FaultRatio | undefined),
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
  my_role: 'claimant' | 'respondent'
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
    claimantId: string
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
        claimantId: res.claimant_id,
        inviteToken: res.invite_token,
        judgeAgentId: res.judge_agent_id,
        claimantEvidence: [],
        respondentEvidence: [],
        claimantEvidenceComplete: false,
        respondentEvidenceComplete: false,
        claimantRebuttals: {},
        respondentRebuttals: {},
        claimantRebuttalComplete: false,
        respondentRebuttalComplete: false,
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
      claimantId: payload.claimantId,
      inviteToken,
      opponentIdentifier: payload.opponentIdentifier,
      claimantEvidence: [],
      respondentEvidence: [],
      claimantEvidenceComplete: false,
      respondentEvidenceComplete: false,
      claimantRebuttals: {},
      respondentRebuttals: {},
      claimantRebuttalComplete: false,
      respondentRebuttalComplete: false,
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
    _respondentId: string,
  ): Promise<boolean> {
    if (isApiMode()) {
      const api = useCaseApi()
      await api.joinCase({ case_id: caseId, invite_token: inviteToken })
      return true
    }
    const c = cases.value[caseId]
    if (!c || c.inviteToken !== inviteToken || c.respondentId) return false
    updateCase(caseId, { respondentId: _respondentId, status: 'active' })
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
        claimantId: detail.claimant_id,
        respondentId: detail.respondent_id ?? undefined,
        inviteToken: detail.invite_token,
        opponentIdentifier: undefined,
        senderName: detail.sender_name ?? undefined,
        senderJobs: detail.sender_jobs ?? undefined,
        senderAddress: detail.sender_address ?? undefined,
        claimantEvidence: [],
        respondentEvidence: [],
        claimantEvidenceComplete: false,
        respondentEvidenceComplete: false,
        claimantRebuttals: {},
        respondentRebuttals: {},
        claimantRebuttalComplete: detail.claimant_rebuttal_complete ?? false,
        respondentRebuttalComplete: detail.respondent_rebuttal_complete ?? false,
        judgeAgentId: detail.judge_agent_id,
      }
      cases.value = { ...cases.value, [caseId]: caseData }
      return caseData
    }

    const [myEvidence, counterpartEvidence] = await Promise.all([
      api.listMyEvidence(caseId),
      api.listCounterpartyEvidence(caseId),
    ])
    const claimantId = detail.claimant_id
    const respondentId = detail.respondent_id ?? undefined
    const mySubmittedBy: EvidenceSubmittedBy = detail.my_role
    const oppSubmittedBy: EvidenceSubmittedBy =
      detail.my_role === 'claimant' ? 'respondent' : 'claimant'
    const claimantEvidence = (detail.my_role === 'claimant' ? myEvidence : counterpartEvidence).map(
      (r) => mapEvidenceResponseToEvidence(r, 'claimant'),
    )
    const respondentEvidence = (
      detail.my_role === 'claimant' ? counterpartEvidence : myEvidence
    ).map((r) => mapEvidenceResponseToEvidence(r, 'respondent'))
    const caseData: CaseData = {
      id: detail.id,
      title: detail.title,
      complaintSummary: detail.description,
      issue: detail.issue,
      status: detail.status as CaseStatus,
      createdAt: detail.created_at,
      claimantId,
      respondentId,
      inviteToken: detail.invite_token,
      opponentIdentifier: undefined,
      senderName: detail.sender_name ?? undefined,
      senderJobs: detail.sender_jobs ?? undefined,
      senderAddress: detail.sender_address ?? undefined,
      claimantEvidence,
      respondentEvidence,
      claimantEvidenceComplete: detail.claimant_evidence_complete,
      respondentEvidenceComplete: detail.respondent_evidence_complete,
      claimantRebuttals: {},
      respondentRebuttals: {},
      claimantRebuttalComplete: detail.claimant_rebuttal_complete ?? false,
      respondentRebuttalComplete: detail.respondent_rebuttal_complete ?? false,
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
        claimantId: '',
        respondentId: undefined,
        inviteToken,
        opponentIdentifier: undefined,
        senderName: preview.sender_name ?? undefined,
        senderJobs: preview.sender_jobs ?? undefined,
        senderAddress: preview.sender_address ?? undefined,
        claimantEvidence: [],
        respondentEvidence: [],
        claimantEvidenceComplete: false,
        respondentEvidenceComplete: false,
        claimantRebuttals: {},
        respondentRebuttals: {},
        claimantRebuttalComplete: false,
        respondentRebuttalComplete: false,
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
      if (evidence.submittedBy === 'claimant') {
        updateCase(caseId, { claimantEvidence: [...c.claimantEvidence, mapped] })
      } else {
        updateCase(caseId, { respondentEvidence: [...c.respondentEvidence, mapped] })
      }
      return
    }
    if (evidence.submittedBy === 'claimant') {
      updateCase(caseId, {
        claimantEvidence: [...c.claimantEvidence, evidence],
      })
    } else {
      updateCase(caseId, {
        respondentEvidence: [...c.respondentEvidence, evidence],
      })
    }
  }

  function removeEvidence(caseId: string, submittedBy: EvidenceSubmittedBy, evidenceId: string) {
    const c = cases.value[caseId]
    if (!c) return
    if (submittedBy === 'claimant') {
      updateCase(caseId, {
        claimantEvidence: c.claimantEvidence.filter((e) => e.id !== evidenceId),
      })
    } else {
      updateCase(caseId, {
        respondentEvidence: c.respondentEvidence.filter((e) => e.id !== evidenceId),
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
    if (submittedBy === 'claimant') {
      updateCase(caseId, { claimantEvidenceComplete: true })
    } else {
      updateCase(caseId, { respondentEvidenceComplete: true })
    }
    const next = cases.value[caseId]
    if (next?.claimantEvidenceComplete && next?.respondentEvidenceComplete) {
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
    if (submittedBy === 'claimant') {
      updateCase(caseId, {
        claimantRebuttals: { ...c.claimantRebuttals, [evidenceId]: rebuttal },
      })
    } else {
      updateCase(caseId, {
        respondentRebuttals: { ...c.respondentRebuttals, [evidenceId]: rebuttal },
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
    if (submittedBy === 'claimant') {
      updateCase(caseId, { claimantRebuttalComplete: true })
    } else {
      updateCase(caseId, { respondentRebuttalComplete: true })
    }
    const next = cases.value[caseId]
    if (next?.claimantRebuttalComplete && next?.respondentRebuttalComplete) {
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
