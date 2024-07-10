import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getUserCompletedChallengesByGame(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/:id/challenges'>, 'components' | 'params' | 'verification'>
) {
  const {
    components: { db },
    verification,
    params
  } = ctx

  const { id } = params

  const validateUuid = uuidSchema.validate(id)

  if (validateUuid.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const challenges = await db.getUserCompletedChallengeByGame(id, verification!.auth)

  return {
    status: 200,
    body: {
      data: challenges
    }
  }
}
