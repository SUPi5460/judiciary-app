import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/storage', () => ({
  getSessionIdByJoinCode: vi.fn(),
}))

import { getSessionIdByJoinCode } from '@/lib/storage'

describe('generateUniqueJoinCode', () => {
  let generateUniqueJoinCode: () => Promise<string>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/lib/join-code')
    generateUniqueJoinCode = mod.generateUniqueJoinCode
  })

  it('returns a 6-character string', async () => {
    vi.mocked(getSessionIdByJoinCode).mockResolvedValue(null)
    const code = await generateUniqueJoinCode()
    expect(code).toHaveLength(6)
  })

  it('contains only valid characters (no 0, O, I, 1)', async () => {
    vi.mocked(getSessionIdByJoinCode).mockResolvedValue(null)
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = await generateUniqueJoinCode()
    for (const ch of code) {
      expect(validChars).toContain(ch)
    }
  })

  it('retries when code already exists', async () => {
    vi.mocked(getSessionIdByJoinCode)
      .mockResolvedValueOnce('existing-session')
      .mockResolvedValueOnce('existing-session')
      .mockResolvedValueOnce(null)
    const code = await generateUniqueJoinCode()
    expect(code).toHaveLength(6)
    expect(getSessionIdByJoinCode).toHaveBeenCalledTimes(3)
  })

  it('throws after MAX_RETRIES failures', async () => {
    vi.mocked(getSessionIdByJoinCode).mockResolvedValue('existing-session')
    await expect(generateUniqueJoinCode()).rejects.toThrow('Failed to generate unique join code')
    expect(getSessionIdByJoinCode).toHaveBeenCalledTimes(5)
  })
})
