export type CaseStatus =
  | 'invite'
  | 'matched'
  | 'plaintiff_submitted'
  | 'defendant_submitted'
  | 'both_submitted'
  | 'judging'
  | 'verdict'

export interface FaultRatio {
  plaintiff: number
  defendant: number
}

export interface CaseData {
  id: string
  title: string
  complaintSummary: string
  status: CaseStatus
  createdAt: string
  plaintiffId: string
  defendantId?: string
  opponentIdentifier?: string
  plaintiffSubmission?: string
  defendantSubmission?: string
  verdictText?: string
  faultRatio?: FaultRatio
}

const STORAGE_KEY = 'ai-judge-cases'

function loadFromStorage(): Record<string, CaseData> {
  if (import.meta.client && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as Record<string, CaseData>
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
    plaintiffId: string
    opponentIdentifier?: string
  }): CaseData {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const caseData: CaseData = {
      id,
      title: payload.title,
      complaintSummary: payload.complaintSummary,
      status: 'invite',
      createdAt: now,
      plaintiffId: payload.plaintiffId,
      opponentIdentifier: payload.opponentIdentifier,
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

  return { cases, createCase, getCase, updateCase }
}
