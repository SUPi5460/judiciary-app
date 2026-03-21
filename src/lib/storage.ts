import { kv } from '@vercel/kv'
import { Session } from '@/types/session'

const SESSION_TTL = 86400 // 24h
const SHARE_TTL = 604800  // 7 days

export async function getSession(id: string): Promise<Session | null> {
  return kv.get<Session>(`session:${id}`)
}

export async function saveSession(session: Session): Promise<void> {
  await kv.set(`session:${session.id}`, session, { ex: SESSION_TTL })
}

export async function deleteSession(id: string): Promise<void> {
  await kv.del(`session:${id}`)
}

export async function getShareReport(id: string): Promise<Session | null> {
  return kv.get<Session>(`share:${id}`)
}

export async function saveShareReport(id: string, session: Session): Promise<void> {
  await kv.set(`share:${id}`, session, { ex: SHARE_TTL })
}
