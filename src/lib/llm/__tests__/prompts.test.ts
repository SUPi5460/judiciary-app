import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildJudgmentPrompt, buildSummaryPrompt } from '../prompts'

describe('prompts', () => {
  it('buildSystemPrompt includes category in Japanese', () => {
    const prompt = buildSystemPrompt('couple', '太郎', '花子')
    expect(prompt).toContain('カップル')
    expect(prompt).toContain('太郎')
    expect(prompt).toContain('花子')
  })

  it('buildSystemPrompt handles unknown category', () => {
    const prompt = buildSystemPrompt('unknown' as any, 'A', 'B')
    expect(prompt).toContain('unknown')
  })

  it('buildJudgmentPrompt includes summary and messages', () => {
    const prompt = buildJudgmentPrompt({
      category: 'married',
      nameA: '太郎',
      nameB: '花子',
      summary: '家事分担について争い',
      recentMessages: '太郎: 私は毎日皿洗いしている',
    })
    expect(prompt).toContain('夫婦')
    expect(prompt).toContain('家事分担について争い')
    expect(prompt).toContain('毎日皿洗い')
  })

  it('buildSummaryPrompt includes messages', () => {
    const prompt = buildSummaryPrompt('太郎: テスト\n花子: テスト')
    expect(prompt).toContain('太郎: テスト')
  })
})
