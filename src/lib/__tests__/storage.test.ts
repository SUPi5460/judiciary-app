import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

import { kv } from '@vercel/kv'
import { getSession, saveSession, deleteSession, getShareReport, saveShareReport } from '../storage'

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSession fetches with correct key', async () => {
    const mockSession = { id: 'abc', status: 'gathering' }
    vi.mocked(kv.get).mockResolvedValue(mockSession)
    const result = await getSession('abc')
    expect(kv.get).toHaveBeenCalledWith('session:abc')
    expect(result).toEqual(mockSession)
  })

  it('getSession returns null for missing session', async () => {
    vi.mocked(kv.get).mockResolvedValue(null)
    const result = await getSession('nonexistent')
    expect(result).toBeNull()
  })

  it('saveSession stores with correct key and TTL', async () => {
    const session = { id: 'abc', status: 'gathering' } as any
    await saveSession(session)
    expect(kv.set).toHaveBeenCalledWith('session:abc', session, { ex: 86400 })
  })

  it('deleteSession removes with correct key', async () => {
    await deleteSession('abc')
    expect(kv.del).toHaveBeenCalledWith('session:abc')
  })

  it('getShareReport fetches with share prefix', async () => {
    vi.mocked(kv.get).mockResolvedValue({ id: 'xyz' })
    await getShareReport('share-id')
    expect(kv.get).toHaveBeenCalledWith('share:share-id')
  })

  it('saveShareReport stores with share prefix and 7-day TTL', async () => {
    const session = { id: 'xyz' } as any
    await saveShareReport('share-id', session)
    expect(kv.set).toHaveBeenCalledWith('share:share-id', session, { ex: 604800 })
  })
})
