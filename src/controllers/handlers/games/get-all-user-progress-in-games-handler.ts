import { HandlerContextWithPath } from '../../../types'

export async function getAllUserProgressInGamesHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/progress'>, 'components' | 'verification'>
) {
  const {
    components: { db, logs },
    verification
  } = ctx

  const logger = logs.getLogger('get-all-user-progress-in-games')

  logger.info(`> Auth > `, { auth: verification!.auth })

  const gamesPlayedByUser = await db.getAllGamesBeingPlayedByUser(verification!.auth)

  return {
    status: 200,
    body: {
      data: gamesPlayedByUser
    }
  }
}
