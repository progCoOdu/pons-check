export interface Inspector {
  id: number
  telegram_id: string
  name: string
  username?: string
  created_at: string
}

export interface Outlet {
  id: number
  name: string
  city: string
  address: string
  manager_name: string
  manager_phone: string
  outlet_phone?: string
  type: 'own' | 'franchise'
  check_interval_days: number
  created_at: string
}

export interface Inspection {
  id: number
  outlet_id: number
  inspector_id: number
  date: string
  score_kko: number
  score_kch: number
  score_kkp: number
  score_kis: number
  total_score: number
  answers: Record<string, boolean | null>
  comments: Record<string, string>
  doc_answers: Record<string, boolean | null>
  created_at: string
  outlet?: Outlet
  inspector?: Inspector
}

export type BlockKey = 'kko' | 'kch' | 'kkp' | 'kis'

export interface ChecklistItem {
  id: string
  text: string
}

export interface ChecklistBlock {
  key: BlockKey
  title: string
  weight: number
  items: ChecklistItem[]
}
