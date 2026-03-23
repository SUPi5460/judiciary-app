import { NextResponse } from 'next/server'
import { getSessionIdByJoinCode, getSession } from '@/lib/storage'
import { notFound, badRequest, serverError } from '@/lib/api-error'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const sessionId = await getSessionIdByJoinCode(code)

    if (!sessionId) {
      return notFound('参加コードが見つかりません')
    }

    const session = await getSession(sessionId)
    if (!session) {
      return notFound('セッションが見つかりません')
    }

    if (session.participants.B === 'joined') {
      return badRequest('既に参加済みです')
    }

    return NextResponse.json({
      sessionId: session.id,
      nameA: session.nameA,
      nameB: session.nameB,
      category: session.category,
    })
  } catch {
    return serverError()
  }
}
