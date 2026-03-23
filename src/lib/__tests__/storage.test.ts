import { describe, it, expect, beforeEach } from 'vitest'
import { getSession, saveSession, deleteSession, getShareReport, saveShareReport } from '../storage'
import type { Session } from '@/types/session'

// Tests run against in-memory store (no KV_REST_API_URL set in test env)

const mockSession: Session = {
  id: 'abc',
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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('storage (in-memory)', () => {
  beforeEach(async () => {
    // Clean up by deleting test keys
    await deleteSession('abc')
    await deleteSession('xyz')
  })

  it('saveSession + getSession round-trips correctly', async () => {
    await saveSession(mockSession)
    const result = await getSession('abc')
    expect(result).toEqual(mockSession)
  })

  it('getSession returns null for missing session', async () => {
    const result = await getSession('nonexistent')
    expect(result).toBeNull()
  })

  it('deleteSession removes the session', async () => {
    await saveSession(mockSession)
    await deleteSession('abc')
    const result = await getSession('abc')
    expect(result).toBeNull()
  })

  it('saveShareReport + getShareReport round-trips correctly', async () => {
    await saveShareReport('share-id', mockSession)
    const result = await getShareReport('share-id')
    expect(result).toEqual(mockSession)
  })

  it('getShareReport returns null for missing report', async () => {
    const result = await getShareReport('nonexistent')
    expect(result).toBeNull()
  })

  it('saveSession overwrites existing session', async () => {
    await saveSession(mockSession)
    const updated = { ...mockSession, status: 'judged' as const }
    await saveSession(updated)
    const result = await getSession('abc')
    expect(result?.status).toBe('judged')
  })
})
