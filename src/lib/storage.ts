import { Session } from '@/types/session'

const SESSION_TTL = 86400 // 24h
const SHARE_TTL = 604800  // 7 days

// In-memory store for local development (no Vercel KV needed)
// In production, replace with @vercel/kv
const useInMemory = !process.env.KV_REST_API_URL

// Use globalThis to persist across hot reloads in dev mode
const globalKey = '__judiciary_mem_store__' as const
type MemEntry = { value: unknown; expiresAt: number }

function getMemoryStore(): Map<string, MemEntry> {
  const g = globalThis as Record<string, unknown>
  if (!g[globalKey]) {
    g[globalKey] = new Map<string, MemEntry>()
  }
  return g[globalKey] as Map<string, MemEntry>
}

function memGet<T>(key: string): T | null {
  const store = getMemoryStore()
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

function memSet(key: string, value: unknown, ttl: number): void {
  getMemoryStore().set(key, { value, expiresAt: Date.now() + ttl * 1000 })
}

function memDel(key: string): void {
  getMemoryStore().delete(key)
}

async function getKv() {
  const { kv } = await import('@vercel/kv')
  return kv
}

export async function getSession(id: string): Promise<Session | null> {
  if (useInMemory) return memGet<Session>(`session:${id}`)
  const kv = await getKv()
  return kv.get<Session>(`session:${id}`)
}

export async function saveSession(session: Session): Promise<void> {
  if (useInMemory) return memSet(`session:${session.id}`, session, SESSION_TTL)
  const kv = await getKv()
  await kv.set(`session:${session.id}`, session, { ex: SESSION_TTL })
}

export async function deleteSession(id: string): Promise<void> {
  if (useInMemory) return memDel(`session:${id}`)
  const kv = await getKv()
  await kv.del(`session:${id}`)
}

export async function getShareReport(id: string): Promise<Session | null> {
  if (useInMemory) return memGet<Session>(`share:${id}`)
  const kv = await getKv()
  return kv.get<Session>(`share:${id}`)
}

export async function saveShareReport(id: string, session: Session): Promise<void> {
  if (useInMemory) return memSet(`share:${id}`, session, SHARE_TTL)
  const kv = await getKv()
  await kv.set(`share:${id}`, session, { ex: SHARE_TTL })
}
