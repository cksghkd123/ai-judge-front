export type CaseStatus =
  | 'pending'
  | 'active'
  | 'reviewing'
  | 'judging'
  | 'completed'

export interface FaultRatio {
  plaintiff: number
  defendant: number
}

export type EvidenceType = 'text' | 'chat' | 'photo'

export type EvidenceSubmittedBy = 'plaintiff' | 'defendant'

export interface Evidence {
  id: string
  type: EvidenceType
  content: string
  description?: string
  submittedBy: EvidenceSubmittedBy
}

export interface EvidenceReview {
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
  plaintiffEvidence: Evidence[]
  defendantEvidence: Evidence[]
  plaintiffEvidenceComplete: boolean
  defendantEvidenceComplete: boolean
  plaintiffReviews: Record<string, EvidenceReview>
  defendantReviews: Record<string, EvidenceReview>
  plaintiffReviewComplete: boolean
  defendantReviewComplete: boolean
  verdictText?: string
  faultRatio?: FaultRatio
}

const STORAGE_KEY = 'ai-judge-cases'

function migrateFromLegacy(data: Record<string, unknown>): Record<string, CaseData> {
  const result: Record<string, CaseData> = {}
  const statusMap: Record<string, CaseStatus> = {
    invite: 'pending',
    matched: 'active',
    plaintiff_submitted: 'active',
    defendant_submitted: 'active',
    both_submitted: 'reviewing',
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
      plaintiffEvidenceComplete: (c.plaintiffEvidenceComplete as boolean) ?? plaintiffEvidence.length > 0,
      defendantEvidenceComplete: (c.defendantEvidenceComplete as boolean) ?? defendantEvidence.length > 0,
      plaintiffReviews: (c.plaintiffReviews as Record<string, EvidenceReview>) ?? {},
      defendantReviews: (c.defendantReviews as Record<string, EvidenceReview>) ?? {},
      plaintiffReviewComplete: (c.plaintiffReviewComplete as boolean) ?? false,
      defendantReviewComplete: (c.defendantReviewComplete as boolean) ?? false,
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
          (c) => c && typeof c === 'object' && 'inviteToken' in c && Array.isArray((c as Record<string, unknown>).plaintiffEvidence)
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
              plaintiffEvidence: Array.isArray(item.plaintiffEvidence) ? item.plaintiffEvidence as Evidence[] : [],
              defendantEvidence: Array.isArray(item.defendantEvidence) ? item.defendantEvidence as Evidence[] : [],
              plaintiffEvidenceComplete: (item.plaintiffEvidenceComplete as boolean) ?? false,
              defendantEvidenceComplete: (item.defendantEvidenceComplete as boolean) ?? false,
              plaintiffReviews: (item.plaintiffReviews as Record<string, EvidenceReview>) ?? {},
              defendantReviews: (item.defendantReviews as Record<string, EvidenceReview>) ?? {},
              plaintiffReviewComplete: (item.plaintiffReviewComplete as boolean) ?? false,
              defendantReviewComplete: (item.defendantReviewComplete as boolean) ?? false,
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

export function useCaseStore() {
  const cases = useState<Record<string, CaseData>>('case-store', () => ({}))

  onMounted(() => {
    const stored = loadFromStorage()
    if (Object.keys(stored).length > 0) {
      cases.value = { ...cases.value, ...stored }
    }
  })

  watch(
    cases,
    (val) => {
      saveToStorage(val)
    },
    { deep: true }
  )

  function createCase(payload: {
    title: string
    complaintSummary: string
    issue: string
    plaintiffId: string
    opponentIdentifier?: string
  }): CaseData {
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
      plaintiffReviews: {},
      defendantReviews: {},
      plaintiffReviewComplete: false,
      defendantReviewComplete: false,
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

  function joinCase(caseId: string, inviteToken: string, defendantId: string): boolean {
    const c = cases.value[caseId]
    if (!c || c.inviteToken !== inviteToken || c.defendantId) return false
    updateCase(caseId, { defendantId, status: 'active' })
    return true
  }

  function addEvidence(caseId: string, evidence: Evidence) {
    const c = cases.value[caseId]
    if (!c) return
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

  function setEvidenceComplete(caseId: string, submittedBy: EvidenceSubmittedBy) {
    const c = cases.value[caseId]
    if (!c) return
    if (submittedBy === 'plaintiff') {
      updateCase(caseId, { plaintiffEvidenceComplete: true })
    } else {
      updateCase(caseId, { defendantEvidenceComplete: true })
    }
    const next = cases.value[caseId]
    if (next?.plaintiffEvidenceComplete && next?.defendantEvidenceComplete) {
      updateCase(caseId, { status: 'reviewing' })
    }
  }

  function setReview(caseId: string, submittedBy: EvidenceSubmittedBy, evidenceId: string, review: EvidenceReview) {
    const c = cases.value[caseId]
    if (!c) return
    if (submittedBy === 'plaintiff') {
      updateCase(caseId, {
        plaintiffReviews: { ...c.plaintiffReviews, [evidenceId]: review },
      })
    } else {
      updateCase(caseId, {
        defendantReviews: { ...c.defendantReviews, [evidenceId]: review },
      })
    }
  }

  function setReviewComplete(caseId: string, submittedBy: EvidenceSubmittedBy) {
    const c = cases.value[caseId]
    if (!c) return
    if (submittedBy === 'plaintiff') {
      updateCase(caseId, { plaintiffReviewComplete: true })
    } else {
      updateCase(caseId, { defendantReviewComplete: true })
    }
    const next = cases.value[caseId]
    if (next?.plaintiffReviewComplete && next?.defendantReviewComplete) {
      updateCase(caseId, { status: 'judging' })
    }
  }

  return {
    cases,
    createCase,
    getCase,
    updateCase,
    joinCase,
    addEvidence,
    removeEvidence,
    setEvidenceComplete,
    setReview,
    setReviewComplete,
  }
}
