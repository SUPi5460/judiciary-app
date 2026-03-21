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

  describe('judge', () => {
    it('returns structured Judgment on valid response', async () => {
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

    it('throws on empty response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.judge({
        category: 'friends', nameA: 'A', nameB: 'B',
        summary: '', recentMessages: '',
      })).rejects.toThrow('Empty response from LLM')
    })

    it('throws on invalid JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'not json at all' } }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.judge({
        category: 'friends', nameA: 'A', nameB: 'B',
        summary: '', recentMessages: '',
      })).rejects.toThrow('Failed to parse LLM response as JSON')
    })

    it('throws on missing issues array', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ resolution: 'ok' }) } }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.judge({
        category: 'friends', nameA: 'A', nameB: 'B',
        summary: '', recentMessages: '',
      })).rejects.toThrow('missing or empty "issues" array')
    })

    it('throws on invalid issue format (missing verdict)', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              issues: [{ issue: 'test', summaryA: 'a', summaryB: 'b', reason: 'r' }],
              resolution: 'ok',
            }),
          },
        }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.judge({
        category: 'friends', nameA: 'A', nameB: 'B',
        summary: '', recentMessages: '',
      })).rejects.toThrow('invalid issue format')
    })

    it('throws on missing resolution', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              issues: [{ issue: 't', summaryA: 'a', summaryB: 'b', verdict: 'A', reason: 'r' }],
            }),
          },
        }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.judge({
        category: 'friends', nameA: 'A', nameB: 'B',
        summary: '', recentMessages: '',
      })).rejects.toThrow('missing "resolution" string')
    })
  })

  describe('summarize', () => {
    it('returns summary string', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ summary: '要約テスト' }) } }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      const result = await client.summarize('太郎: テスト')
      expect(result).toBe('要約テスト')
    })

    it('throws on invalid JSON', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'not json' } }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.summarize('test')).rejects.toThrow('Failed to parse LLM summary as JSON')
    })

    it('throws on missing summary field', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ other: 'data' }) } }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.summarize('test')).rejects.toThrow('missing "summary" string')
    })

    it('throws on empty response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      })

      const client = new OpenAIJudgeClient('fake-key')
      await expect(client.summarize('test')).rejects.toThrow('Empty response from LLM')
    })
  })
})
