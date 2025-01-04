const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

let DEBUG_ENABLED = false

export const setDebugMode = (enabled: boolean) => {
  DEBUG_ENABLED = enabled
}

export const debug = {
  log: (...args: unknown[]) => {
    if (IS_DEVELOPMENT || DEBUG_ENABLED) {
      console.log('[SDK Debug]:', ...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (IS_DEVELOPMENT || DEBUG_ENABLED) {
      console.warn('[SDK Warning]:', ...args)
    }
  },

  error: (...args: unknown[]) => {
    if (IS_DEVELOPMENT || DEBUG_ENABLED) {
      console.error('[SDK Error]:', ...args)
    }
  },
}
