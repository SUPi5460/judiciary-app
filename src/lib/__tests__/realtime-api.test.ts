import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock storage
vi.mock('@/lib/storage', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
}))

// Mock buildSystemPrompt
vi.mock('@/lib/llm/prompts', () => ({
  buildSystemPrompt: vi.fn().mockReturnValue('mocked system prompt'),
}))

import { getSession, saveSession } from '@/lib/storage'
import type { Session } from '@/types/session'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-id',
    userId: null,
    status: 'gathering',
    category: 'couple',
    nameA: '太郎',
    nameB: '花子',
    messages: [],
    summary: null,
    judgment: null,
    mode: 'single',
    joinCode: null,
    participants: { A: 'joined', B: 'joined' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ── POST /api/realtime/token ──
describe('POST /api/realtime/token', () => {
  let POST: (req: Request) => Promise<Response>
  const originalFetch = global.fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    // Restore and re-mock fetch each time
    global.fetch = originalFetch
    const mod = await import('@/app/api/realtime/token/route')
    POST = mod.POST
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('returns token on success', async () => {
    const session = makeSession({ mode: 'multi' })
    vi.mocked(getSession).mockResolvedValue(session)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ value: 'eph-token-123', expires_at: 1234567890 }),
    })

    const req = new Request('http://localhost/api/realtime/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-id' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBe('eph-token-123')
    expect(body.expiresAt).toBe(1234567890)
  })

  it('returns 404 for missing session', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/realtime/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'nonexistent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 400 for missing sessionId', async () => {
    const req = new Request('http://localhost/api/realtime/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ── POST /api/session/[id]/transcript ──
describe('POST /api/session/[id]/transcript', () => {
  let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/transcript/route')
    POST = mod.POST
  })

  it('saves AI transcript', async () => {
    const session = makeSession({ mode: 'multi' })
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveSession).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/session/test-id/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'AI', content: 'AI response text' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)

    const saved = vi.mocked(saveSession).mock.calls[0][0]
    expect(saved.messages).toHaveLength(1)
    expect(saved.messages[0].speaker).toBe('AI')
    expect(saved.messages[0].content).toBe('AI response text')
  })

  it('saves user transcript (speaker A)', async () => {
    const session = makeSession({ mode: 'multi' })
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveSession).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/session/test-id/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'A', content: 'User said something' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)

    const saved = vi.mocked(saveSession).mock.calls[0][0]
    expect(saved.messages[0].speaker).toBe('A')
  })

  it('rejects invalid speaker', async () => {
    const session = makeSession()
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'C', content: 'invalid' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('rejects when not gathering', async () => {
    const session = makeSession({ status: 'judged' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'AI', content: 'too late' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })
})
