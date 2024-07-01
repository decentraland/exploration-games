import { ContextWithAuth } from '../../types'

export default async function isAdminMiddleware(ctx: ContextWithAuth, next: () => Promise<any>) {
  const { components } = ctx

  const logger = components.logs.getLogger('is-admin-middleware')

  const admins = await components.config.getString('ADMINS')

  if (!admins) {
    return { status: 500, body: {} }
  }

  const userAdmins = admins.split(',')

  if (!userAdmins.some((address) => address.toLowerCase() === ctx.verification!.auth.toLowerCase())) {
    logger.debug(`${ctx.verification?.auth} is not admin`)
    return { status: 403, body: {} }
  }

  return next()
}
