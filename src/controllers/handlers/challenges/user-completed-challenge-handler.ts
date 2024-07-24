import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function userCompletedChallengeHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/challenges/:id'>, 'components' | 'params' | 'verification'>
) {
  const {
    components: { db },
    verification,
    params
  } = ctx

  const { id } = params

  const validateId = uuidSchema.validate(id)

  if (validateId.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const challenge = await db.getChallenge(id)

  if (!challenge) {
    throw new InvalidRequestError(`${id} doesn't exist`)
  }

  await db.setChallengeAsComplete(verification!.auth, id)

  return {
    status: 204
  }
}
