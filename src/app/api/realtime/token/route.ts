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
            output: { voice: 'marin' },
          },
          input_audio_transcription: {
            model: 'gpt-4o-mini-transcribe',
          },
          turn_detection: {
            type: 'semantic_vad',
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
