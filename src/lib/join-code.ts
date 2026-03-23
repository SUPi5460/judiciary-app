import { randomInt } from 'crypto'
import { getSessionIdByJoinCode } from './storage'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MAX_RETRIES = 5

function randomCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS[randomInt(CHARS.length)]
  }
  return code
}

export async function generateUniqueJoinCode(): Promise<string> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = randomCode()
    const existing = await getSessionIdByJoinCode(code)
    if (!existing) return code
  }
  throw new Error('Failed to generate unique join code')
}
