import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock storage
vi.mock('@/lib/storage', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  saveJoinCodeIndex: vi.fn(),
  getSessionIdByJoinCode: vi.fn(),
}))

// Mock join-code
vi.mock('@/lib/join-code', () => ({
  generateUniqueJoinCode: vi.fn(),
}))

import { getSession, saveSession, saveJoinCodeIndex, getSessionIdByJoinCode } from '@/lib/storage'
import { generateUniqueJoinCode } from '@/lib/join-code'
import type { Session } from '@/types/session'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-id',
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

// ── POST /api/session/create (mode support) ──
describe('POST /api/session/create (mode support)', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/create/route')
    POST = mod.POST
  })

  it('creates session with mode=multi and generates joinCode', async () => {
    vi.mocked(saveSession).mockResolvedValue(undefined)
    vi.mocked(saveJoinCodeIndex).mockResolvedValue(undefined)
    vi.mocked(generateUniqueJoinCode).mockResolvedValue('ABC123')

    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: '太郎', nameB: '花子', category: 'couple', mode: 'multi' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeDefined()
    expect(body.joinCode).toBe('ABC123')
    expect(saveJoinCodeIndex).toHaveBeenCalledWith('ABC123', expect.any(String))

    const savedSession = vi.mocked(saveSession).mock.calls[0][0]
    expect(savedSession.mode).toBe('multi')
    expect(savedSession.joinCode).toBe('ABC123')
    expect(savedSession.participants).toEqual({ A: 'joined', B: 'waiting' })
  })

  it('creates session with mode=single (default) and null joinCode', async () => {
    vi.mocked(saveSession).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: '太郎', nameB: '花子' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.joinCode).toBeNull()
    expect(saveJoinCodeIndex).not.toHaveBeenCalled()

    const savedSession = vi.mocked(saveSession).mock.calls[0][0]
    expect(savedSession.mode).toBe('single')
    expect(savedSession.participants).toEqual({ A: 'joined', B: 'joined' })
  })

  it('returns 400 for invalid mode value', async () => {
    const req = new Request('http://localhost/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA: '太郎', nameB: '花子', mode: 'invalid' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ── GET /api/session/join/[code] ──
describe('GET /api/session/join/[code]', () => {
  let GET: (req: Request, ctx: { params: Promise<{ code: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/join/[code]/route')
    GET = mod.GET
  })

  it('returns session info for valid join code', async () => {
    const session = makeSession({
      mode: 'multi',
      joinCode: 'ABC123',
      participants: { A: 'joined', B: 'waiting' },
    })
    vi.mocked(getSessionIdByJoinCode).mockResolvedValue('test-id')
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/join/ABC123')
    const res = await GET(req, { params: Promise.resolve({ code: 'ABC123' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sessionId).toBe('test-id')
    expect(body.nameA).toBe('太郎')
    expect(body.nameB).toBe('花子')
    expect(body.category).toBe('couple')
  })

  it('returns 404 for invalid join code', async () => {
    vi.mocked(getSessionIdByJoinCode).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/join/INVALID')
    const res = await GET(req, { params: Promise.resolve({ code: 'INVALID' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 when participant B already joined', async () => {
    const session = makeSession({
      mode: 'multi',
      joinCode: 'ABC123',
      participants: { A: 'joined', B: 'joined' },
    })
    vi.mocked(getSessionIdByJoinCode).mockResolvedValue('test-id')
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/join/ABC123')
    const res = await GET(req, { params: Promise.resolve({ code: 'ABC123' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('既に参加済みです')
  })
})

// ── POST /api/session/[id]/join ──
describe('POST /api/session/[id]/join', () => {
  let POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/join/route')
    POST = mod.POST
  })

  it('sets participant B to joined', async () => {
    const session = makeSession({
      mode: 'multi',
      joinCode: 'ABC123',
      participants: { A: 'joined', B: 'waiting' },
    })
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveSession).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/session/test-id/join', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')

    const savedSession = vi.mocked(saveSession).mock.calls[0][0]
    expect(savedSession.participants.B).toBe('joined')
  })

  it('returns 400 for single mode session', async () => {
    const session = makeSession({ mode: 'single' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/join', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 400 when B already joined', async () => {
    const session = makeSession({
      mode: 'multi',
      participants: { A: 'joined', B: 'joined' },
    })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/join', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/missing/join', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

// ── GET /api/session/[id]/poll ──
describe('GET /api/session/[id]/poll', () => {
  let GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/session/[id]/poll/route')
    GET = mod.GET
  })

  it('returns correct poll data', async () => {
    const session = makeSession({
      status: 'gathering',
      messages: [{ id: 'm1', speaker: 'A', content: 'テスト', timestamp: '2026-01-01T00:00:00.000Z' }],
      participants: { A: 'joined', B: 'waiting' },
    })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/session/test-id/poll')
    const res = await GET(req, { params: Promise.resolve({ id: 'test-id' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('gathering')
    expect(body.messageCount).toBe(1)
    expect(body.participants).toEqual({ A: 'joined', B: 'waiting' })
    expect(body.updatedAt).toBeDefined()
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/session/missing/poll')
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})
