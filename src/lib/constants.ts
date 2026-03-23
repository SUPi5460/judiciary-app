export const FREE_TURN_LIMIT = 10
export const AUTH_TURN_LIMIT = 20
export const AUTH_SESSION_TTL = 2592000 // 30 days

// 制限解除アカウント（管理者・テスター）
export const UNLIMITED_EMAILS = [
  'supi5460@gmail.com',
  'moea000120@gmail.com',
]

export function getTurnLimit(userEmail: string | null, userId: string | null): number {
  if (userEmail && UNLIMITED_EMAILS.includes(userEmail)) return Infinity
  if (userId) return AUTH_TURN_LIMIT
  return FREE_TURN_LIMIT
}
