import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      }
    },
  }
})

import { OpenAIJudgeClient } from '../judge-client'

describe('OpenAIJudgeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('judge returns structured Judgment', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            issues: [{
              issue: '家事分担',
              summaryA: 'Aの主張',
              summaryB: 'Bの主張',
              verdict: 'B',
              reason: '理由',
            }],
            resolution: '解決策',
          }),
        },
      }],
    })

    const client = new OpenAIJudgeClient('fake-key')
    const result = await client.judge({
      category: 'married',
      nameA: '太郎',
      nameB: '花子',
      summary: 'テスト',
      recentMessages: 'テスト',
    })
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].verdict).toBe('B')
    expect(result.resolution).toBe('解決策')
    expect(result.createdAt).toBeDefined()
  })

  it('summarize returns summary string', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({ summary: '要約テスト' }),
        },
      }],
    })

    const client = new OpenAIJudgeClient('fake-key')
    const result = await client.summarize('太郎: テスト')
    expect(typeof result).toBe('string')
    expect(result).toBe('要約テスト')
  })

  it('judge throws on empty response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    })

    const client = new OpenAIJudgeClient('fake-key')
    await expect(client.judge({
      category: 'friends',
      nameA: 'A',
      nameB: 'B',
      summary: '',
      recentMessages: '',
    })).rejects.toThrow('Empty response from LLM')
  })
})
