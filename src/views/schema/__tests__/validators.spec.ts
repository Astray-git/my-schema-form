import { describe, expect, it, vi } from 'vitest'
import { validators } from '../validators'
import { logger } from '@/utils'

describe('validator: one_of', () => {
  const rule = ['foo', 'bar', 'barz']
  it('return check fn', () => {
    expect(validators.one_of(['1'])).toBeTypeOf('function')
  })
  const checkFn = validators.one_of(rule)
  it('valid one_of', () => {
    expect(checkFn('foo')).toBe(true)
  })

  it('return error message for invalid one_of', () => {
    expect(checkFn('zzz')).toBe('Value should be one of: foo,bar,barz')
  })
})

describe('validator: match_none', () => {
  const rule = { err: 'error', pattern: '//' }
  it('return check fn', () => {
    expect(validators.match_none(rule)).toBeTypeOf('function')
  })
  const checkFn = validators.match_none(rule)
  it('valid match_none', () => {
    expect(checkFn('foo')).toBe(true)
  })

  it('should bypass invalid pattern', () => {
    vi.spyOn(logger, 'warn')
    const invalidPattern = { err: 'error', pattern: 'blah' }
    const fn = validators.match_none(invalidPattern)
    expect(logger.warn).toHaveBeenCalled()
    expect(fn('foo')).toBe(true)
  })

  it('return error message for invalid value', () => {
    expect(checkFn('//test')).toBe('error')
  })
})
