import { Message } from './message'
import { Judgment } from './judgment'

export type SessionStatus = 'gathering' | 'ready_for_judge' | 'judging' | 'judged'
export type Category = 'friends' | 'couple' | 'married' | 'other'
export type Speaker = 'A' | 'B'

export interface Session {
  id: string
  status: SessionStatus
  category: Category | null
  nameA: string
  nameB: string
  messages: Message[]
  summary: string | null
  judgment: Judgment | null
  createdAt: string
  updatedAt: string
}
