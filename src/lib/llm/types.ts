import { Judgment } from '@/types/judgment'

export interface JudgeClient {
  judge(params: JudgeParams): Promise<Judgment>
  summarize(messages: string): Promise<string>
}

export interface JudgeParams {
  category: string
  nameA: string
  nameB: string
  summary: string
  recentMessages: string
}
