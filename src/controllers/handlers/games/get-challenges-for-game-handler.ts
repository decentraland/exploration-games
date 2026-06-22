import { InvalidRequestError } from '@dcl/http-commons'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getChallengesForGameHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/:id/challenges'>, 'components' | 'params'>
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

  const challenges = await db.getActiveChallengesForGame(id)

  return {
    status: 200,
    body: {
      data: challenges
    }
  }
}
