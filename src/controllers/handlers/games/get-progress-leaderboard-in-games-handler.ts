import { InvalidRequestError } from '@dcl/platform-server-commons'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getProgressLeaderboardInGamesHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/games/:id/leaderboard'>, 'components' | 'params'>
) {
  const {
    components: { db },
    params
  } = ctx

  const { id } = params

  const validateUuid = uuidSchema.validate(id)

  if (validateUuid.error) {
    throw new InvalidRequestError('Invalid UUID')
  }
  const leaderboard = await db.getGameLeaderboard(id)

  return {
    status: 200,
    body: {
      data: leaderboard
    }
  }
}
