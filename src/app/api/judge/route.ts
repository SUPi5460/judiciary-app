import { NextRequest, NextResponse } from 'next/server'
import { getSession, saveSession } from '@/lib/storage'
import { transition } from '@/lib/session-machine'
import { OpenAIJudgeClient } from '@/lib/llm/judge-client'
import { badRequest, notFound, serverError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  if (!sessionId) return badRequest('sessionId is required')

  const session = await getSession(sessionId)
  if (!session) return notFound('セッションが見つかりません')

  const previousStatus = session.status

  try {
    session.status = transition(session.status, 'start_judge')
    await saveSession(session)

    const client = new OpenAIJudgeClient(process.env.OPENAI_API_KEY!)
    const messagesText = session.messages
      .map(m => `${m.speaker}: ${m.content}`)
      .join('\n')
    const summary = session.summary ?? await client.summarize(messagesText)

    const judgment = await client.judge({
      category: session.category ?? 'other',
      nameA: session.nameA,
      nameB: session.nameB,
      summary,
      recentMessages: messagesText,
    })

    session.judgment = { ...judgment, createdAt: new Date().toISOString() }
    session.summary = summary
    session.status = transition(session.status, 'complete_judge')
    session.updatedAt = new Date().toISOString()
    await saveSession(session)

    return NextResponse.json({ judgment: session.judgment })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid transition')) {
      return badRequest('この状態では判定を実行できません')
    }

    // LLM失敗時: ステータスをロールバック
    console.error('Judge API error:', error)
    try {
      session.status = previousStatus
      session.updatedAt = new Date().toISOString()
      await saveSession(session)
    } catch (rollbackError) {
      console.error('Failed to rollback session status:', rollbackError)
    }

    return serverError('判定処理中にエラーが発生しました')
  }
}
