import { HandlerContextWithPath } from '../../../types'

export async function getMissionsAvailableHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/missions/available'>, 'components' | 'verification'>
) {
  const {
    components: { db, logs },
    verification
  } = ctx

  const logger = logs.getLogger('get-missions-available')

  logger.info(`> Auth > `, { auth: verification!.auth })

  const missions = await db.getMissionsAvailableForUser(verification!.auth)

  return {
    status: 200,
    body: {
      data: missions
    }
  }
}
