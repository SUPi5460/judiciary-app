import { describe, it, expect } from 'vitest'
import { validateName, validateMessage, sanitizeInput } from '../validation'

describe('sanitizeInput', () => {
  it('strips script tags with content', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello')
  })

  it('strips regular HTML tags', () => {
    expect(sanitizeInput('<b>bold</b> <i>italic</i>')).toBe('bold italic')
  })

  it('strips entity-encoded HTML tags', () => {
    expect(sanitizeInput('&lt;img src=x onerror=alert(1)&gt;hello')).toBe('hello')
  })

  it('strips nested/malformed tags', () => {
    expect(sanitizeInput('<div><span>text</span></div>')).toBe('text')
  })

  it('handles tags-only input becoming empty', () => {
    expect(sanitizeInput('<b></b><script></script>')).toBe('')
  })

  it('strips zero-width characters', () => {
    expect(sanitizeInput('hello\u200Bworld')).toBe('helloworld')
  })
})

describe('validateName', () => {
  it('rejects empty string', () => {
    expect(validateName('')).toEqual({ valid: false, error: '名前を入力してください' })
  })

  it('rejects whitespace-only string', () => {
    expect(validateName('   ')).toEqual({ valid: false, error: '名前を入力してください' })
  })

  it('rejects zero-width characters only', () => {
    expect(validateName('\u200B\u200C\u200D')).toEqual({ valid: false, error: '名前を入力してください' })
  })

  it('rejects tags-only input (empty after sanitize)', () => {
    expect(validateName('<b></b>')).toEqual({ valid: false, error: '名前を入力してください' })
  })

  it('rejects string over 20 chars', () => {
    expect(validateName('a'.repeat(21))).toEqual({ valid: false, error: '名前は20文字以内で入力してください' })
  })

  it('accepts valid name', () => {
    expect(validateName('太郎')).toEqual({ valid: true })
  })

  it('accepts name with surrounding whitespace (trimmed)', () => {
    expect(validateName('  花子  ')).toEqual({ valid: true })
  })
})

describe('validateMessage', () => {
  it('rejects empty string', () => {
    expect(validateMessage('')).toEqual({ valid: false, error: 'メッセージを入力してください' })
  })

  it('rejects whitespace-only string', () => {
    expect(validateMessage('   ')).toEqual({ valid: false, error: 'メッセージを入力してください' })
  })

  it('rejects string over 2000 chars', () => {
    expect(validateMessage('a'.repeat(2001))).toEqual({ valid: false, error: 'メッセージは2000文字以内で入力してください' })
  })

  it('accepts valid message', () => {
    expect(validateMessage('家事の分担について話し合いたい')).toEqual({ valid: true })
  })
})
