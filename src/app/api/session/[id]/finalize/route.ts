import { NextResponse } from 'next/server'
import { getSession, saveSession } from '@/lib/storage'
import { transition } from '@/lib/session-machine'
import { badRequest, notFound, serverError } from '@/lib/api-error'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession(id)

    if (!session) {
      return notFound('セッションが見つかりません')
    }

    if (session.status !== 'gathering') {
      return badRequest('finalize は gathering 状態でのみ可能です')
    }

    if (session.messages.length === 0) {
      return badRequest('メッセージがないセッションは finalize できません')
    }

    session.status = transition(session.status, 'finalize')
    session.updatedAt = new Date().toISOString()

    await saveSession(session)

    return NextResponse.json({ status: session.status })
  } catch {
    return serverError()
  }
}
