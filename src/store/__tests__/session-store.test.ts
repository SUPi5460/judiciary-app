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
    expect(state.pollingInterval).toBeNull()
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
    const mockStorage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    })

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'test-id' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'test-id', userId: null, status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        mode: 'single', joinCode: null, participants: { A: 'joined', B: 'waiting' },
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      })))

    await useSessionStore.getState().createSession('太郎', '花子', 'couple')
    const state = useSessionStore.getState()
    expect(state.session?.id).toBe('test-id')
    expect(state.session?.nameA).toBe('太郎')
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(localStorage.setItem).toHaveBeenCalledWith('speaker:test-id', 'A')

    vi.unstubAllGlobals()
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
        id: 'test-id', userId: null, status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        mode: 'single', joinCode: null, participants: { A: 'joined', B: 'joined' },
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
      currentSpeaker: 'A',
    })

    const userMsg = { id: '1', speaker: 'A' as const, content: 'テスト', timestamp: '2026-01-01' }
    const aiMsg = { id: '2', speaker: 'AI' as const, content: 'AI応答', timestamp: '2026-01-01' }

    const fullSession = {
      id: 'test-id', userId: null, status: 'gathering', nameA: '太郎', nameB: '花子',
      messages: [userMsg, aiMsg], category: 'couple', summary: null, judgment: null,
      mode: 'single', joinCode: null, participants: { A: 'joined', B: 'joined' },
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
        id: 'test-id', userId: null, status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        mode: 'single', joinCode: null, participants: { A: 'joined', B: 'joined' },
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    })

    const finalizedSession = {
      id: 'test-id', userId: null, status: 'ready_for_judge', nameA: '太郎', nameB: '花子',
      messages: [], category: 'couple', summary: 'まとめ', judgment: null,
      mode: 'single', joinCode: null, participants: { A: 'joined', B: 'joined' },
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
        id: 'test-id', userId: null, status: 'ready_for_judge', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: 'まとめ', judgment: null,
        mode: 'single', joinCode: null, participants: { A: 'joined', B: 'joined' },
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    })

    const judgment = {
      issues: [{ issue: '問題1', summaryA: 'A側', summaryB: 'B側', verdict: 'A' as const, reason: '理由' }],
      resolution: '解決策',
      createdAt: '2026-01-01',
    }

    const judgedSession = {
      id: 'test-id', userId: null, status: 'judged', nameA: '太郎', nameB: '花子',
      messages: [], category: 'couple', summary: 'まとめ', judgment,
      mode: 'single', joinCode: null, participants: { A: 'joined', B: 'joined' },
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
        id: 'test-id', userId: null, status: 'judged', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: 'まとめ', judgment: null,
        mode: 'single', joinCode: null, participants: { A: 'joined', B: 'joined' },
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

  it('reset clears state and polling', () => {
    useSessionStore.setState({
      session: { id: 'test' } as any,
      currentSpeaker: 'B',
      pollingInterval: setInterval(() => {}, 10000) as any,
    })
    useSessionStore.getState().reset()
    const state = useSessionStore.getState()
    expect(state.session).toBeNull()
    expect(state.currentSpeaker).toBe('A')
    expect(state.pollingInterval).toBeNull()
  })

  it('joinSession calls APIs in order and sets session', async () => {
    const lookupResponse = { sessionId: 'sess-1', nameA: '太郎', nameB: '花子' }
    const sessionData = {
      id: 'sess-1', status: 'gathering', nameA: '太郎', nameB: '花子',
      messages: [], category: 'couple', summary: null, judgment: null,
      mode: 'multi', joinCode: 'ABC123', participants: { A: 'joined', B: 'joined' },
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(lookupResponse)))   // GET /join/:code
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' }))) // POST /join
      .mockResolvedValueOnce(new Response(JSON.stringify(sessionData)))      // GET /session/:id

    // Mock localStorage for setSpeakerForSession
    const mockStorage: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    })

    await useSessionStore.getState().joinSession('ABC123')
    const state = useSessionStore.getState()
    expect(state.session?.id).toBe('sess-1')
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(localStorage.setItem).toHaveBeenCalledWith('speaker:sess-1', 'B')

    vi.unstubAllGlobals()
  })

  it('joinSession sets error on failure', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }))

    await useSessionStore.getState().joinSession('INVALID')
    const state = useSessionStore.getState()
    expect(state.session).toBeNull()
    expect(state.error).toBeTruthy()
    expect(state.isLoading).toBe(false)
  })

  it('startPolling creates interval', () => {
    useSessionStore.setState({
      session: {
        id: 'test-id', userId: null, status: 'gathering', nameA: '太郎', nameB: '花子',
        messages: [], category: 'couple', summary: null, judgment: null,
        mode: 'multi', joinCode: 'ABC123', participants: { A: 'joined', B: 'joined' },
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      } as any,
    })

    useSessionStore.getState().startPolling()
    const state = useSessionStore.getState()
    expect(state.pollingInterval).not.toBeNull()

    // Clean up
    useSessionStore.getState().stopPolling()
  })

  it('startPolling does nothing without session', () => {
    useSessionStore.getState().startPolling()
    expect(useSessionStore.getState().pollingInterval).toBeNull()
  })

  it('startPolling does nothing if already polling', () => {
    const fakeInterval = setInterval(() => {}, 10000)
    useSessionStore.setState({
      session: { id: 'test-id' } as any,
      pollingInterval: fakeInterval,
    })

    useSessionStore.getState().startPolling()
    // Should still be the same interval, not replaced
    expect(useSessionStore.getState().pollingInterval).toBe(fakeInterval)

    clearInterval(fakeInterval)
  })

  it('stopPolling clears interval', () => {
    const fakeInterval = setInterval(() => {}, 10000)
    useSessionStore.setState({ pollingInterval: fakeInterval })

    useSessionStore.getState().stopPolling()
    expect(useSessionStore.getState().pollingInterval).toBeNull()
  })
})
