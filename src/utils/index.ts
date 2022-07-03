/**
 * get label text from a snake_case key
 * @param key a snake_case string
 * @returns some "Label Text"
 */
export function labelFromKey(key: string) {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export { http } from './http'
export { logger } from './logger'
