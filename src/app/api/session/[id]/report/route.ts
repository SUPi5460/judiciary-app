import { NextResponse } from 'next/server'
import { getSession } from '@/lib/storage'
import { badRequest, notFound, serverError } from '@/lib/api-error'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession(id)

    if (!session) {
      return notFound('セッションが見つかりません')
    }

    if (session.status !== 'judged') {
      return badRequest('判定がまだ完了していません')
    }

    return NextResponse.json({
      judgment: session.judgment,
      summary: session.summary,
    })
  } catch {
    return serverError()
  }
}
