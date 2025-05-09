import { HandlerContextWithPath } from '../../types'

export default async function isValidKeyMiddleware(
  ctx: HandlerContextWithPath<'logs' | 'config', any>,
  next: () => Promise<any>
) {
  const { components } = ctx
  const logger = components.logs.getLogger('is-valid-key-middleware')

  const expectedTokenString = await components.config.getString('ALLOWED_KEYS')
  if (!expectedTokenString) {
    return { status: 500, body: {} }
  }

  const allowedTokens = expectedTokenString
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  const authHeader = ctx.request.headers.get('authorization') || ctx.request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.debug('Missing or invalid Authorization header')
    return { status: 403, body: {} }
  }

  const token = authHeader.slice(7) // Remove 'Bearer ' prefix

  if (!allowedTokens.includes(token)) {
    logger.debug('Invalid Colyseus API token')
    return { status: 403, body: {} }
  }

  return next()
}
