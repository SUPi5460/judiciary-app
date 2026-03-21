import { describe, it, expect } from 'vitest'
import { validateName, validateMessage, sanitizeInput } from '../validation'

describe('validation', () => {
  it('validateName rejects empty string', () => {
    expect(validateName('')).toEqual({ valid: false, error: '名前を入力してください' })
  })

  it('validateName rejects string over 20 chars', () => {
    expect(validateName('a'.repeat(21))).toEqual({ valid: false, error: '名前は20文字以内で入力してください' })
  })

  it('validateName accepts valid name', () => {
    expect(validateName('太郎')).toEqual({ valid: true })
  })

  it('validateMessage rejects empty string', () => {
    expect(validateMessage('')).toEqual({ valid: false, error: 'メッセージを入力してください' })
  })

  it('validateMessage rejects string over 2000 chars', () => {
    expect(validateMessage('a'.repeat(2001))).toEqual({ valid: false, error: 'メッセージは2000文字以内で入力してください' })
  })

  it('sanitizeInput strips HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello')
  })
})
