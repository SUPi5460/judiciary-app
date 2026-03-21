import { NextResponse } from 'next/server'
import { getSession } from '@/lib/storage'
import { notFound, serverError } from '@/lib/api-error'

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

    return NextResponse.json(session)
  } catch {
    return serverError()
  }
}
