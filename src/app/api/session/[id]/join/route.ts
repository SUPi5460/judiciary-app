import { NextResponse } from 'next/server'
import { getSession, saveSession } from '@/lib/storage'
import { notFound, badRequest, serverError } from '@/lib/api-error'

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

    if (session.mode !== 'multi') {
      return badRequest('シングルモードのセッションには参加できません')
    }

    if (session.participants.B === 'joined') {
      return badRequest('既に参加済みです')
    }

    session.participants.B = 'joined'
    session.updatedAt = new Date().toISOString()
    await saveSession(session)

    return NextResponse.json({ status: 'ok' })
  } catch {
    return serverError()
  }
}
