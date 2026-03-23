import type { Speaker } from '@/types/session'

export function setSpeakerForSession(sessionId: string, speaker: Speaker): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`speaker:${sessionId}`, speaker)
}

export function getSpeakerForSession(sessionId: string): Speaker {
  if (typeof window === 'undefined') return 'A'
  const stored = localStorage.getItem(`speaker:${sessionId}`)
  if (stored === 'A' || stored === 'B') return stored
  return 'A'
}
