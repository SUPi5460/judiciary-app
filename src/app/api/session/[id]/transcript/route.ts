import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getSession, saveSession } from '@/lib/storage'
import { badRequest, notFound, serverError } from '@/lib/api-error'
import { FREE_TURN_LIMIT, AUTH_TURN_LIMIT } from '@/lib/constants'
import type { Speaker } from '@/types/session'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession(id)
    if (!session) return notFound('セッションが見つかりません')
    if (session.mode !== 'multi') return badRequest('transcript APIはマルチデバイスモード専用です')
    if (session.participants?.B !== 'joined') return badRequest('参加者が揃っていません')
    if (session.status !== 'gathering') return badRequest('gathering状態でのみ追加可能です')

    const { speaker, content } = await req.json() as { speaker?: Speaker | 'AI'; content?: string }
    if (!speaker || !content) return badRequest('speaker と content は必須です')
    if (!['A', 'B', 'AI'].includes(speaker)) return badRequest('speaker は A, B, AI のいずれかを指定してください')
    if (content.length > 5000) return badRequest('content が長すぎます')

    const turnLimit = session.userId ? AUTH_TURN_LIMIT : FREE_TURN_LIMIT
    const userTurns = session.messages.filter(m => m.speaker !== 'AI').length
    if (speaker !== 'AI' && userTurns >= turnLimit) {
      return badRequest('ターン上限に達しました。')
    }

    session.messages.push({
      id: uuidv4(),
      speaker,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    })
    session.updatedAt = new Date().toISOString()
    await saveSession(session)

    return NextResponse.json({ ok: true })
  } catch {
    return serverError()
  }
}
