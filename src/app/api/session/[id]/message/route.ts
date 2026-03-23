import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getSession, saveSession } from '@/lib/storage'
import { validateMessage, sanitizeInput } from '@/lib/validation'
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

    if (!session) {
      return notFound('セッションが見つかりません')
    }

    if (session.status !== 'gathering') {
      return badRequest('メッセージの追加は gathering 状態でのみ可能です')
    }

    const body = await req.json()
    const { speaker, content } = body as {
      speaker?: Speaker | 'AI'
      content?: string
    }

    if (!speaker || !content) {
      return badRequest('speaker と content は必須です')
    }

    if (speaker === 'AI') {
      return badRequest('AI の発言はサーバーからのみ追加できます')
    }

    if (speaker !== 'A' && speaker !== 'B') {
      return badRequest('speaker は A または B を指定してください')
    }

    const turnLimit = session.userId ? AUTH_TURN_LIMIT : FREE_TURN_LIMIT
    const userTurns = session.messages.filter(m => m.speaker !== 'AI').length
    if (userTurns >= turnLimit) {
      return badRequest('ターン上限に達しました。判定に進んでください。')
    }

    // マルチデバイスモード: Bが未参加ならBとして発言不可
    if (session.mode === 'multi' && speaker === 'B' && session.participants?.B !== 'joined') {
      return badRequest('参加者Bはまだセッションに参加していません')
    }

    const msgResult = validateMessage(content)
    if (!msgResult.valid) {
      return badRequest(msgResult.error)
    }

    const sanitized = sanitizeInput(content)

    session.messages.push({
      id: uuidv4(),
      speaker,
      content: sanitized,
      timestamp: new Date().toISOString(),
    })
    session.updatedAt = new Date().toISOString()

    await saveSession(session)

    return NextResponse.json({ messages: session.messages })
  } catch {
    return serverError()
  }
}
