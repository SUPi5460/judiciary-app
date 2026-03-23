import { create } from 'zustand'

import type { Category, Session, SessionMode, Speaker } from '@/types/session'
import { getSpeakerForSession, setSpeakerForSession } from '@/lib/speaker-storage'

interface SessionState {
  session: Session | null
  currentSpeaker: Speaker
  isLoading: boolean
  error: string | null
  pollingInterval: ReturnType<typeof setInterval> | null

  createSession: (nameA: string, nameB: string, category?: Category, mode?: SessionMode) => Promise<void>
  joinSession: (code: string) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  addMessage: (content: string) => Promise<void>
  switchSpeaker: () => void
  finalize: () => Promise<void>
  requestJudgment: () => Promise<void>
  generateShareLink: () => Promise<string | null>
  reopenSession: () => Promise<void>
  loadSession: (id: string) => Promise<void>
  reset: () => void
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await response.json()
    if (data && typeof data.error === 'string') {
      return data.error
    }
  } catch {
    // Ignore JSON parsing errors.
  }
  return response.statusText || 'Request failed'
}

const fetchJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await getErrorMessage(response)
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  currentSpeaker: 'A',
  isLoading: false,
  error: null,
  pollingInterval: null,

  createSession: async (nameA, nameB, category, mode) => {
    set({ isLoading: true, error: null })
    try {
      const createResponse = await fetchJson<{ id: string }>('/api/session/create', {
        method: 'POST',
        body: JSON.stringify({ nameA, nameB, category, mode }),
      })
      const session = await fetchJson<Session>(`/api/session/${createResponse.id}`)
      set({ session })
      setSpeakerForSession(session.id, 'A')
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create session' })
    } finally {
      set({ isLoading: false })
    }
  },

  joinSession: async (code: string) => {
    set({ isLoading: true, error: null })
    try {
      const lookup = await fetchJson<{ sessionId: string; nameA: string; nameB: string }>(
        `/api/session/join/${code}`,
      )
      await fetchJson<{ status: string }>(
        `/api/session/${lookup.sessionId}/join`,
        { method: 'POST' },
      )
      const session = await fetchJson<Session>(`/api/session/${lookup.sessionId}`)
      set({ session })
      setSpeakerForSession(lookup.sessionId, 'B')
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to join session' })
    } finally {
      set({ isLoading: false })
    }
  },

  startPolling: () => {
    const { session, pollingInterval } = get()
    if (!session || pollingInterval) return
    let lastUpdatedAt = session.updatedAt
    const interval = setInterval(async () => {
      try {
        const { session: current } = get()
        if (!current) return
        const poll = await fetchJson<{
          messageCount: number
          participants: { A: string; B: string }
          status: string
          updatedAt: string
        }>(`/api/session/${current.id}/poll`)
        if (poll.updatedAt !== lastUpdatedAt) {
          lastUpdatedAt = poll.updatedAt
          const updated = await fetchJson<Session>(`/api/session/${current.id}`)
          set({ session: updated })
        }
      } catch {
        // Polling error - ignore and retry next interval
      }
    }, 3000)
    set({ pollingInterval: interval })
  },

  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) clearInterval(pollingInterval)
    set({ pollingInterval: null })
  },

  addMessage: async (content) => {
    const { session, currentSpeaker } = get()
    if (!session) {
      return
    }
    // Multi mode: use fixed speaker from localStorage
    const speaker = session.mode === 'multi'
      ? getSpeakerForSession(session.id)
      : currentSpeaker
    set({ isLoading: true, error: null })
    try {
      // 1. ユーザーメッセージ送信
      const msgResult = await fetchJson<{ messages: Session['messages'] }>(
        `/api/session/${session.id}/message`,
        {
          method: 'POST',
          body: JSON.stringify({ speaker, content }),
        },
      )
      // メッセージ一覧を即座に反映
      set((state) => {
        if (!state.session) return {}
        return { session: { ...state.session, messages: msgResult.messages } }
      })

      // 2. AI応答を取得
      await fetchJson<{ message: unknown }>(
        `/api/session/${session.id}/ai-respond`,
        { method: 'POST' },
      )

      // 3. セッション全体を再取得して確実に同期
      const updated = await fetchJson<Session>(`/api/session/${session.id}`)
      set({ session: updated })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add message' })
    } finally {
      set({ isLoading: false })
    }
  },

  switchSpeaker: () => {
    set((state) => ({
      currentSpeaker: state.currentSpeaker === 'A' ? 'B' : 'A',
    }))
  },

  finalize: async () => {
    set({ isLoading: true, error: null })
    try {
      const { session } = get()
      if (!session) {
        return
      }
      // /api/finalize returns { status } only, so re-fetch full session
      await fetchJson<{ status: string }>(
        `/api/session/${session.id}/finalize`,
        { method: 'POST' },
      )
      const updatedSession = await fetchJson<Session>(`/api/session/${session.id}`)
      set({ session: updatedSession })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to finalize session' })
    } finally {
      set({ isLoading: false })
    }
  },

  requestJudgment: async () => {
    set({ isLoading: true, error: null })
    try {
      const { session } = get()
      if (!session) {
        return
      }
      // /api/judge returns { judgment } only, so re-fetch full session after
      await fetchJson<{ judgment: unknown }>('/api/judge', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id }),
      })
      const updatedSession = await fetchJson<Session>(`/api/session/${session.id}`)
      set({ session: updatedSession })

      const topic = updatedSession.judgment?.issues
        ?.map((i: { issue: string }) => i.issue)
        .join('、') ?? null

      // Cloud history: logged-in users' sessions are already persisted in KV
      // with 30-day TTL (AUTH_SESSION_TTL) set at session creation time.
      const history = JSON.parse(localStorage.getItem('judiciary-history') || '[]')
        .filter((e: { id: string }) => e.id !== updatedSession.id)
      history.unshift({
        id: updatedSession.id,
        nameA: updatedSession.nameA,
        nameB: updatedSession.nameB,
        category: updatedSession.category,
        topic,
        date: new Date().toISOString(),
      })
      localStorage.setItem('judiciary-history', JSON.stringify(history.slice(0, 20)))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to request judgment' })
    } finally {
      set({ isLoading: false })
    }
  },

  generateShareLink: async () => {
    set({ isLoading: true, error: null })
    try {
      const { session } = get()
      if (!session) {
        return null
      }
      const response = await fetchJson<{ shareUrl: string }>('/api/share', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id }),
      })
      return response.shareUrl
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to generate share link' })
      return null
    } finally {
      set({ isLoading: false })
    }
  },

  reopenSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const { session } = get()
      if (!session) return
      await fetchJson<{ status: string }>(
        `/api/session/${session.id}/reopen`,
        { method: 'POST' },
      )
      const updatedSession = await fetchJson<Session>(`/api/session/${session.id}`)
      set({ session: updatedSession })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reopen session' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadSession: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const session = await fetchJson<Session>(`/api/session/${id}`)
      set({ session })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load session' })
    } finally {
      set({ isLoading: false })
    }
  },

  reset: () => {
    get().stopPolling()
    set({
      session: null,
      currentSpeaker: 'A',
      isLoading: false,
      error: null,
      pollingInterval: null,
    })
  },
}))
