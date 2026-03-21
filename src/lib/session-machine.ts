import { SessionStatus } from '@/types/session'

export type SessionAction = 'finalize' | 'start_judge' | 'complete_judge'

const transitions: Record<SessionStatus, Partial<Record<SessionAction, SessionStatus>>> = {
  gathering: { finalize: 'ready_for_judge' },
  ready_for_judge: { start_judge: 'judging' },
  judging: { complete_judge: 'judged' },
  judged: {},
}

export function transition(current: SessionStatus, action: SessionAction): SessionStatus {
  const next = transitions[current]?.[action]
  if (!next) {
    throw new Error(`Invalid transition: ${current} + ${action}`)
  }
  return next
}

export function canTransition(current: SessionStatus, action: SessionAction): boolean {
  return transitions[current]?.[action] !== undefined
}
