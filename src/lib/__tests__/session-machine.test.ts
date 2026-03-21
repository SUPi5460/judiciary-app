import { describe, it, expect } from 'vitest'
import { transition, canTransition } from '../session-machine'

describe('session-machine', () => {
  it('gathering → ready_for_judge is valid', () => {
    expect(transition('gathering', 'finalize')).toBe('ready_for_judge')
  })

  it('ready_for_judge → judging is valid', () => {
    expect(transition('ready_for_judge', 'start_judge')).toBe('judging')
  })

  it('judging → judged is valid', () => {
    expect(transition('judging', 'complete_judge')).toBe('judged')
  })

  it('gathering → judging is invalid', () => {
    expect(() => transition('gathering', 'start_judge')).toThrow()
  })

  it('judged → gathering is invalid', () => {
    expect(() => transition('judged', 'finalize')).toThrow()
  })

  it('canTransition returns correct boolean', () => {
    expect(canTransition('gathering', 'finalize')).toBe(true)
    expect(canTransition('gathering', 'start_judge')).toBe(false)
  })
})
