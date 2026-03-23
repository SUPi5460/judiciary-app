import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/storage'
import { buildSystemPrompt } from '@/lib/llm/prompts'
import { badRequest, notFound, serverError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return badRequest('sessionId is required')

    const session = await getSession(sessionId)
    if (!session) return notFound('セッションが見つかりません')

    // マルチデバイスモードかつ両者参加済みのみ許可
    if (session.mode !== 'multi') return badRequest(`音声通話はマルチデバイスモードでのみ利用可能です (mode=${session.mode})`)
    if (session.participants?.B !== 'joined') return badRequest(`参加者が揃っていません (B=${session.participants?.B})`)
    if (session.status !== 'gathering') return badRequest(`gathering状態でのみ利用可能です (status=${session.status})`)

    const instructions = buildSystemPrompt(
      session.category ?? 'other',
      session.nameA,
      session.nameB
    )

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
          instructions,
          audio: {
            input: {
              transcription: { model: 'gpt-4o-mini-transcribe' },
            },
            output: { voice: 'marin' },
          },
        },
      }),
    })

    if (!response.ok) {
      console.error('OpenAI token error:', await response.text())
      return serverError('Realtime tokenの取得に失敗しました')
    }

    const data = await response.json()
    return NextResponse.json({ token: data.value, expiresAt: data.expires_at })
  } catch {
    return serverError()
  }
}
