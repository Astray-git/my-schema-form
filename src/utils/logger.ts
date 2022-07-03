const isDev = import.meta.env.DEV === true

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
/**
 * TODO: custom logger for production
 */
const customLogger = {
  log: noop,
  warn: noop,
  error: noop,
}

export const logger = {
  log: isDev ? console.log : customLogger.log,
  warn: isDev ? console.log : customLogger.warn,
  error: isDev ? console.log : customLogger.error,
}
