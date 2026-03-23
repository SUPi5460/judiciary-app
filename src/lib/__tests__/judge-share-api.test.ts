import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock storage
vi.mock('@/lib/storage', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  getShareReport: vi.fn(),
  saveShareReport: vi.fn(),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('share-uuid-1234'),
}))

// Mock OpenAIJudgeClient
vi.mock('@/lib/llm/judge-client', () => ({
  OpenAIJudgeClient: class MockOpenAIJudgeClient {
    judge = vi.fn().mockResolvedValue({
      issues: [{ issue: 'test', summaryA: 'a', summaryB: 'b', verdict: 'A', reason: 'r' }],
      resolution: 'solution',
      createdAt: new Date().toISOString(),
    })
    summarize = vi.fn().mockResolvedValue('summary')
  },
}))

import { getSession, saveSession, getShareReport, saveShareReport } from '@/lib/storage'
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

// ── POST /api/judge ──
describe('POST /api/judge', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/judge/route')
    POST = mod.POST
  })

  it('executes judgment for a ready_for_judge session', async () => {
    const session = makeSession({
      status: 'ready_for_judge',
      messages: [
        { id: 'm1', speaker: 'A', content: '相手が悪い', timestamp: '2026-01-01T00:00:00.000Z' },
        { id: 'm2', speaker: 'B', content: '自分は悪くない', timestamp: '2026-01-01T00:00:01.000Z' },
      ],
    })
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveSession).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-id' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.judgment).toBeDefined()
    expect(body.judgment.issues).toHaveLength(1)
    expect(body.judgment.resolution).toBe('solution')
    // saveSession called twice: once for judging, once for judged
    expect(saveSession).toHaveBeenCalledTimes(2)
  })

  it('returns 400 when session is in wrong state', async () => {
    const session = makeSession({ status: 'gathering' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-id' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when sessionId is missing', async () => {
    const req = new Request('http://localhost/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'missing' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})

// ── POST /api/share ──
describe('POST /api/share', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/share/route')
    POST = mod.POST
  })

  it('creates a share link for a judged session', async () => {
    const session = makeSession({
      status: 'judged',
      judgment: {
        issues: [{ issue: 'test', summaryA: 'a', summaryB: 'b', verdict: 'A', reason: 'r' }],
        resolution: 'solution',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      summary: '要約テスト',
    })
    vi.mocked(getSession).mockResolvedValue(session)
    vi.mocked(saveShareReport).mockResolvedValue(undefined)

    const req = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-id' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.shareId).toBe('share-uuid-1234')
    expect(body.shareUrl).toBe('/share/share-uuid-1234')
    expect(saveShareReport).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when session is not judged', async () => {
    const session = makeSession({ status: 'gathering' })
    vi.mocked(getSession).mockResolvedValue(session)

    const req = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-id' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when sessionId is missing', async () => {
    const req = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when session not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const req = new Request('http://localhost/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'missing' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})

// ── GET /api/share/[id] ──
describe('GET /api/share/[id]', () => {
  let GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/app/api/share/[id]/route')
    GET = mod.GET
  })

  it('returns share report when found', async () => {
    const session = makeSession({
      status: 'judged',
      judgment: {
        issues: [{ issue: 'test', summaryA: 'a', summaryB: 'b', verdict: 'A', reason: 'r' }],
        resolution: 'solution',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      summary: '要約テスト',
    })
    vi.mocked(getShareReport).mockResolvedValue(session)

    const req = new Request('http://localhost/api/share/share-uuid-1234')
    const res = await GET(req, { params: Promise.resolve({ id: 'share-uuid-1234' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.judgment).toBeDefined()
    expect(body.summary).toBe('要約テスト')
  })

  it('returns 404 when share report not found', async () => {
    vi.mocked(getShareReport).mockResolvedValue(null)

    const req = new Request('http://localhost/api/share/missing')
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})
