import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'
import { getSession, saveSession } from '@/lib/storage'
import { buildSystemPrompt } from '@/lib/llm/prompts'
import { badRequest, notFound, serverError } from '@/lib/api-error'
import type { Message } from '@/types/message'

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
      return badRequest('AI応答は gathering 状態でのみ可能です')
    }

    const systemPrompt = buildSystemPrompt(
      session.category ?? 'other',
      session.nameA,
      session.nameB
    )

    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...session.messages.map((m: Message) => ({
        role: 'user' as const,
        content: `[${m.speaker}] ${m.content}`,
      })),
    ]

    let aiContent: string
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await client.chat.completions.create({
        model: 'gpt-5.4-mini',
        messages: openaiMessages,
      })
      aiContent = response.choices[0]?.message?.content ?? ''
    } catch (err) {
      console.error('OpenAI API error:', err)
      return serverError('AI応答の取得に失敗しました')
    }

    const aiMessage: Message = {
      id: uuidv4(),
      speaker: 'AI',
      content: aiContent,
      timestamp: new Date().toISOString(),
    }

    session.messages.push(aiMessage)
    session.updatedAt = new Date().toISOString()

    await saveSession(session)

    return NextResponse.json({ message: aiMessage })
  } catch {
    return serverError()
  }
}
