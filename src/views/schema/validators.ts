import { logger } from '@/utils'
import { PATTERN_REGEXP_MAP } from './constants'

/**
 * check integer value between given range
 * @param range [min, max] array
 */
function between(range: [number, number]) {
  const [min, max] = range
  return function checkBetween(val: any) {
    if (!Number.isNaN(val)) {
      if (val < min || val > max) {
        return `Value should between ${min} and ${max}`
      }
      return true
    }
    return 'Please input integer value'
  }
}

/**
 * check value in given value array
 * @param values available value array
 */
function one_of(values: string[]) {
  const s = new Set(values)
  return function checkOneOf(value: string) {
    return s.has(value) || `Value should be one of: ${values.join()}`
  }
}

/**
 * check value start with string
 * @param startWithString
 */
function starts_with(startWithString: string) {
  return function checkStartWith(value: string) {
    return (
      value.startsWith(startWithString) ||
      `Value should start with: ${startWithString}`
    )
  }
}

/**
 * check len_min rule
 * @param len min length
 */
function len_min(len: number) {
  return function checkLen(value: string[]) {
    return value.length > len
  }
}

/**
 * check match_none rule
 * @param rule schema match_none rule
 */
function match_none(rule: { err: string; pattern: string }) {
  const regexp = PATTERN_REGEXP_MAP[rule.pattern]
  if (!regexp) {
    logger.warn(`Check for pattern ${rule.pattern} is not available.`)
  }
  return function checkMatchNone(value: string) {
    if (!regexp || !regexp.test(value)) return true
    return rule.err
  }
}

/**
 * check match rule
 * @param rule pattern string to match
 */
function match(rule: string) {
  const regexp = PATTERN_REGEXP_MAP[rule]
  if (!regexp) {
    logger.warn(`Check for pattern ${rule} is not available.`)
  }
  return function checkNone(value: string) {
    if (!regexp || regexp.test(value)) return true
    // hard code error msg
    return `input should match pattern ${rule}`
  }
}

/**
 * check match_all rule
 * @param rules multiple rules to check
 */
function match_all(rules: { err: string; pattern: string }[]) {
  const ruleList = rules.map(({ err, pattern }) => {
    const regexp = PATTERN_REGEXP_MAP[pattern] || ''
    if (!regexp) {
      logger.warn(`Check for pattern ${pattern} is not available.`)
    }
    return { regexp, err }
  })
  return function checkMatchAll(value: string) {
    const errs: string[] = []
    ruleList.forEach(({ err, regexp }) => {
      if (!regexp || regexp.test(value)) return
      errs.push(err)
    })
    if (errs.length === 0) return true
    return errs.join('; ')
  }
}
/**
 * check match_any rule
 * @param rule
 */
function match_any(rule: { err: string; patterns: string[] }) {
  const regexpList = rule.patterns.map((pattern) => {
    const regexp = PATTERN_REGEXP_MAP[pattern] || ''
    if (!regexp) {
      logger.warn(`Check for pattern ${pattern} is not available.`)
    }
    return regexp
  })
  return function checkMatchNone(value: string) {
    let valid = true
    regexpList.forEach((regexp) => {
      if (!regexp || regexp.test(value)) return
      valid = false
    })
    return valid || rule.err
  }
}

/**
 * check match_any rule
 * @param rules
 */
function mutually_exclusive_subsets(rules: string[][]) {
  return function checkMutallyExclusive(value: Set<string>) {
    const arrValue = Array.from(value)
    if (arrValue.length === 0) return 'Please choose one option'
    // get rule set
    const theRule = rules.find((oneRule) => {
      return oneRule.includes(arrValue[0])
    })
    if (!theRule) return 'invalid option' // not possible in router entity
    if (arrValue.length === 1) return true
    const arr = arrValue.slice()
    arr.shift()
    let count = arrValue.length - 1
    for (let i = 0; i < theRule.length; i++) {
      const index = arr.indexOf(theRule[i])
      if (index > -1) {
        arr.splice(index, 1)
        count--
      }
    }
    return count === 0 ? true : 'conflict options'
  }
}

export const validators = {
  between,
  one_of,
  starts_with,
  len_min,
  match_none,
  match,
  match_all,
  match_any,
  mutually_exclusive_subsets,
}

export const validatorKeys = Object.keys(validators)
