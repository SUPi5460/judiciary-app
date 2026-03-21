import OpenAI from 'openai'
import { Judgment } from '@/types/judgment'
import { JudgeClient, JudgeParams } from './types'
import { buildJudgmentPrompt, buildSummaryPrompt } from './prompts'

export class OpenAIJudgeClient implements JudgeClient {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async judge(params: JudgeParams): Promise<Judgment> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: 'あなたは公平な裁判官です。JSON形式で回答してください。' },
        { role: 'user', content: buildJudgmentPrompt(params) },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from LLM')

    const parsed = JSON.parse(content)
    return {
      issues: parsed.issues,
      resolution: parsed.resolution,
      createdAt: new Date().toISOString(),
    }
  }

  async summarize(messages: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'user', content: buildSummaryPrompt(messages) },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from LLM')

    const parsed = JSON.parse(content)
    return parsed.summary
  }
}
