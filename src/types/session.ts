import { Message } from './message'
import { Judgment } from './judgment'

export type SessionStatus = 'gathering' | 'ready_for_judge' | 'judging' | 'judged'
export type Category = 'friends' | 'couple' | 'married' | 'other'
export type Speaker = 'A' | 'B'
export type SessionMode = 'single' | 'multi'
export type ParticipantStatus = 'waiting' | 'joined'

export interface Session {
  id: string
  userId: string | null
  userEmail: string | null
  status: SessionStatus
  category: Category | null
  nameA: string
  nameB: string
  messages: Message[]
  summary: string | null
  judgment: Judgment | null
  mode: SessionMode
  joinCode: string | null
  participants: {
    A: ParticipantStatus
    B: ParticipantStatus
  }
  createdAt: string
  updatedAt: string
  isPremium?: boolean
}
