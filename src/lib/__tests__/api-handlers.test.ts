import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock storage
vi.mock('@/lib/storage', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  deleteSession: vi.fn(),
  saveJoinCodeIndex: vi.fn(),
  getSessionIdByJoinCode: vi.fn(),
}))

// Mock join-code
vi.mock('@/lib/join-code', () => ({
  generateUniqueJoinCode: vi.fn().mockResolvedValue(null),
}))

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}))

// Mock auth options
vi.mock('@/auth', () => ({
  authOptions: {},
}))

// Mock OpenAI
const mockCreate = vi.fn()
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = { completions: { create: mockCreate } }
    },
  }
})

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

// ── POST /api/session/create ──
describe('POST /api/session/create', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/create/route')
    POST = mod.POST
  })

  it('creates a session with valid input and returns 201', async () => {
    vi.mocked(saveSession).mockResolvedValue(undefined)
    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: '太郎', nameB: '花子', category: 'couple' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeDefined()
    expect(typeof body.id).toBe('string')
    expect(saveSession).toHaveBeenCalledTimes(1)
  })

  it('creates a session without category (defaults to null)', async () => {
    vi.mocked(saveSession).mockResolvedValue(undefined)
    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: '太郎', nameB: '花子' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const savedSession = vi.mocked(saveSession).mock.calls[0][0]
    expect(savedSession.category).toBeNull()
  })

  it('returns 400 for empty nameA', async () => {
    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: '', nameB: '花子' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty nameB', async () => {
    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: '太郎', nameB: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for name exceeding 20 chars', async () => {
    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: 'あ'.repeat(21), nameB: '花子' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ── GET /api/session/[id] ──
describe('GET /api/session/[id]', () => {
  let GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/route')
    GET = mod.GET
  })

  it('returns session when found', async () => {
    const session = makeSession()
    vi.mocked(getSession).mockResolvedValue(session)
    const req = new Request('http://localhost/api/session/test-id')
    const res = await GET(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('test-id')
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    const req = new Request('http://localhost/api/session/missing')
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

// ── POST /api/session/[id]/message ──
describe('POST /api/session/[id]/message', () => {
  let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/message/route')
    POST = mod.POST
  })

  it('adds a message to a gathering session', async () => {
    const session = makeSession()
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveSession).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/session/test-id/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'A', content: 'テストメッセージ' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0].speaker).toBe('A')
    expect(body.messages[0].content).toBe('テストメッセージ')
  })

  it('returns 400 for empty message', async () => {
    const session = makeSession()
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'A', content: '' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 400 when session is not in gathering state', async () => {
    const session = makeSession({ status: 'judged' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'A', content: 'テスト' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/missing/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speaker: 'A', content: 'テスト' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

// ── POST /api/session/[id]/finalize ──
describe('POST /api/session/[id]/finalize', () => {
  let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/finalize/route')
    POST = mod.POST
  })

  it('finalizes a gathering session with messages', async () => {
    const session = makeSession({
      messages: [{ id: 'm1', speaker: 'A', content: 'テスト', timestamp: '2026-01-01T00:00:00.000Z' }],
    })
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveSession).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/session/test-id/finalize', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ready_for_judge')
  })

  it('returns 400 when session has no messages', async () => {
    const session = makeSession({ messages: [] })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/finalize', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 400 when session is not in gathering state', async () => {
    const session = makeSession({
      status: 'judged',
      messages: [{ id: 'm1', speaker: 'A', content: 'テスト', timestamp: '2026-01-01T00:00:00.000Z' }],
    })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/finalize', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/missing/finalize', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

// ── GET /api/session/[id]/status ──
describe('GET /api/session/[id]/status', () => {
  let GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/status/route')
    GET = mod.GET
  })

  it('returns session status', async () => {
    const session = makeSession({ status: 'gathering' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/status')
    const res = await GET(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('gathering')
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/missing/status')
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

// ── GET /api/session/[id]/report ──
describe('GET /api/session/[id]/report', () => {
  let GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/report/route')
    GET = mod.GET
  })

  it('returns report when session is judged', async () => {
    const session = makeSession({
      status: 'judged',
      judgment: {
        issues: [{ issue: 'テスト', summaryA: 'A', summaryB: 'B', verdict: 'A', reason: '理由' }],
        resolution: '解決策',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      summary: '要約テスト',
    })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/report')
    const res = await GET(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.judgment).toBeDefined()
    expect(body.summary).toBe('要約テスト')
  })

  it('returns 400 when session is not judged', async () => {
    const session = makeSession({ status: 'gathering' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/report')
    const res = await GET(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/missing/report')
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

// ── POST /api/session/[id]/ai-respond ──
describe('POST /api/session/[id]/ai-respond', () => {
  let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/ai-respond/route')
    POST = mod.POST
  })

  it('returns AI response when session is gathering', async () => {
    const session = makeSession({
      messages: [{ id: 'm1', speaker: 'A', content: '相手が悪い', timestamp: '2026-01-01T00:00:00.000Z' }],
    })
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveSession).mockResolvedValue(undefined)

    // Mock OpenAI response
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'AI仲裁の回答です' } }],
    })

    const req = new Request('http://localhost/api/session/test-id/ai-respond', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message.speaker).toBe('AI')
    expect(body.message.content).toBe('AI仲裁の回答です')
  })

  it('returns 400 when session is not in gathering state', async () => {
    const session = makeSession({ status: 'judged' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/ai-respond', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 500 when OpenAI call fails', async () => {
    const session = makeSession({
      messages: [{ id: 'm1', speaker: 'A', content: 'テスト', timestamp: '2026-01-01T00:00:00.000Z' }],
    })
    vi.mocked(getSession).mockResolvedValue(session)

    mockCreate.mockRejectedValue(new Error('OpenAI API error'))

    const req = new Request('http://localhost/api/session/test-id/ai-respond', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(500)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/missing/ai-respond', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})
