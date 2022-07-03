export const enum Entity {
  Service = 'service',
  Route = 'route',
  Consumer = 'consumer',
}
export const enum Plugin {
  BasicAuth = 'basic-auth',
}

/**
 * Hard code some lua pattern to regexp
 * https://www.lua.org/pil/20.2.html
 *
 * may implement a conversion helper
 * or use https://github.com/fengari-lua/fengari to run lua patterns in real app
 */
export const PATTERN_REGEXP_MAP: Record<string, RegExp> = {
  '//': /\/\//,
  '^%u+$': /^[A-Z]+$/,
  '^%*%.': /^\*\./,
  '%.%*$': /\.\*$/,
  '^[^*]*$': /^[^*]*$/,
  '^[^*]*%*?[^*]*$': /^[^*]*\*?[^*]*$/,
  '^[Hh][Oo][Ss][Tt]$': /^[Hh][Oo][Ss][Tt]$/,
}
