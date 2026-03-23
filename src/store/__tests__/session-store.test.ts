import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSessionStore } from '../session-store'

// Mock fetch globally
global.fetch = vi.fn()

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
    vi.clearAllMocks()
  })

  it('initial state is correct', () => {
    const state = useSessionStore.getState()
    expect(state.session).toBeNull()
    expect(state.currentSpeaker).toBe('A')
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('switchSpeaker toggles between A and B', () => {
    const store = useSessionStore.getState()
    expect(store.currentSpeaker).toBe('A')
    store.switchSpeaker()
    expect(useSessionStore.getState().currentSpeaker).toBe('B')
    useSessionStore.getState().switchSpeaker()
    expect(useSessionStore.getState().currentSpeaker).toBe('A')
  })

  it('createSession calls API and sets session', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'test-id' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'test-id', status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      })))

    await useSessionStore.getState().createSession('太郎', '花子', 'couple')
    const state = useSessionStore.getState()
    expect(state.session?.id).toBe('test-id')
    expect(state.session?.nameA).toBe('太郎')
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('createSession sets error on API failure', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 }))

    await useSessionStore.getState().createSession('太郎', '花子', 'couple')
    const state = useSessionStore.getState()
    expect(state.session).toBeNull()
    expect(state.error).toBeTruthy()
    expect(state.isLoading).toBe(false)
  })

  it('addMessage sends message and gets AI response', async () => {
    // Set initial session
    useSessionStore.setState({
      session: {
        id: 'test-id', status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
      currentSpeaker: 'A',
    })

    const userMsg = { id: '1', speaker: 'A' as const, content: 'テスト', timestamp: '2026-01-01' }
    const aiMsg = { id: '2', speaker: 'AI' as const, content: 'AI応答', timestamp: '2026-01-01' }

    const fullSession = {
      id: 'test-id', status: 'gathering', nameA: '太郎', nameB: '花子',
      messages: [userMsg, aiMsg], category: 'couple', summary: null, judgment: null,
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ messages: [userMsg] })))       // message POST
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: aiMsg })))             // ai-respond
      .mockResolvedValueOnce(new Response(JSON.stringify(fullSession)))                    // session re-fetch

    await useSessionStore.getState().addMessage('テスト')
    const state = useSessionStore.getState()
    expect(state.session?.messages).toHaveLength(2)
  })

  it('addMessage does nothing when no session', async () => {
    await useSessionStore.getState().addMessage('テスト')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('finalize updates session status', async () => {
    useSessionStore.setState({
      session: {
        id: 'test-id', status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    })

    const finalizedSession = {
      id: 'test-id', status: 'ready_for_judge', nameA: '太郎', nameB: '花子',
      messages: [], category: 'couple', summary: 'まとめ', judgment: null,
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ready_for_judge' })))  // finalize
      .mockResolvedValueOnce(new Response(JSON.stringify(finalizedSession)))                // re-fetch

    await useSessionStore.getState().finalize()
    const state = useSessionStore.getState()
    expect(state.session?.status).toBe('ready_for_judge')
  })

  it('requestJudgment updates session with judgment', async () => {
    useSessionStore.setState({
      session: {
        id: 'test-id', status: 'ready_for_judge', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: 'まとめ', judgment: null,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    })

    const judgment = {
      issues: [{ issue: '問題1', summaryA: 'A側', summaryB: 'B側', verdict: 'A' as const, reason: '理由' }],
      resolution: '解決策',
      createdAt: '2026-01-01',
    }

    const judgedSession = {
      id: 'test-id', status: 'judged', nameA: '太郎', nameB: '花子',
      messages: [], category: 'couple', summary: 'まとめ', judgment,
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ judgment })))     // judge
      .mockResolvedValueOnce(new Response(JSON.stringify(judgedSession)))    // re-fetch

    // Mock localStorage
    const mockStorage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    })

    await useSessionStore.getState().requestJudgment()
    const state = useSessionStore.getState()
    expect(state.session?.status).toBe('judged')
    expect(state.session?.judgment).toBeTruthy()
    expect(localStorage.setItem).toHaveBeenCalledWith('judiciary-history', expect.any(String))
  })

  it('generateShareLink returns share URL', async () => {
    useSessionStore.setState({
      session: {
        id: 'test-id', status: 'judged', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: 'まとめ', judgment: null,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    })

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ shareUrl: '/share/abc123' })))

    const url = await useSessionStore.getState().generateShareLink()
    expect(url).toBe('/share/abc123')
  })

  it('loadSession fetches and sets session', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'loaded-id', status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      })))

    await useSessionStore.getState().loadSession('loaded-id')
    const state = useSessionStore.getState()
    expect(state.session?.id).toBe('loaded-id')
  })

  it('reset clears state', () => {
    useSessionStore.setState({ session: { id: 'test' } as any, currentSpeaker: 'B' })
    useSessionStore.getState().reset()
    const state = useSessionStore.getState()
    expect(state.session).toBeNull()
    expect(state.currentSpeaker).toBe('A')
  })
})
