import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getSession, saveShareReport } from '@/lib/storage'
import { badRequest, notFound, serverError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  if (!sessionId) return badRequest('sessionId is required')

  const session = await getSession(sessionId)
  if (!session) return notFound('セッションが見つかりません')

  if (session.status !== 'judged') {
    return badRequest('判定が完了していないセッションです')
  }

  try {
    const shareId = uuidv4()
    // 共有レポートには判定結果のみ保存（生メッセージはプライバシー保護のため除外）
    const shareData = {
      ...session,
      messages: [],
    }
    await saveShareReport(shareId, shareData)

    return NextResponse.json({ shareId, shareUrl: `/share/${shareId}` })
  } catch (error) {
    console.error('Share API error:', error)
    return serverError('共有リンクの生成中にエラーが発生しました')
  }
}
