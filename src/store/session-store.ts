import { create } from 'zustand'

import type { Category, Session, Speaker } from '@/types/session'

interface SessionState {
  session: Session | null
  currentSpeaker: Speaker
  isLoading: boolean
  error: string | null

  createSession: (nameA: string, nameB: string, category?: Category) => Promise<void>
  addMessage: (content: string) => Promise<void>
  switchSpeaker: () => void
  finalize: () => Promise<void>
  requestJudgment: () => Promise<void>
  generateShareLink: () => Promise<string | null>
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

  createSession: async (nameA, nameB, category) => {
    set({ isLoading: true, error: null })
    try {
      const createResponse = await fetchJson<{ id: string }>('/api/session/create', {
        method: 'POST',
        body: JSON.stringify({ nameA, nameB, category }),
      })
      const session = await fetchJson<Session>(`/api/session/${createResponse.id}`)
      set({ session })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create session' })
    } finally {
      set({ isLoading: false })
    }
  },

  addMessage: async (content) => {
    const { session, currentSpeaker } = get()
    if (!session) {
      return
    }
    set({ isLoading: true, error: null })
    try {
      await fetchJson(`/api/session/${session.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ speaker: currentSpeaker, content }),
      })
      const aiResponse = await fetchJson<{ messages: Session['messages'] }>(
        `/api/session/${session.id}/ai-respond`,
        { method: 'POST' },
      )
      set((state) => {
        if (!state.session) {
          return {}
        }
        return { session: { ...state.session, messages: aiResponse.messages } }
      })
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
      const updatedSession = await fetchJson<Session>(
        `/api/session/${session.id}/finalize`,
        { method: 'POST' },
      )
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
      const updatedSession = await fetchJson<Session>('/api/judge', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id }),
      })
      set({ session: updatedSession })

      const history = JSON.parse(localStorage.getItem('judiciary-history') || '[]')
      history.unshift({
        id: updatedSession.id,
        nameA: updatedSession.nameA,
        nameB: updatedSession.nameB,
        category: updatedSession.category,
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
    set({
      session: null,
      currentSpeaker: 'A',
      isLoading: false,
      error: null,
    })
  },
}))
