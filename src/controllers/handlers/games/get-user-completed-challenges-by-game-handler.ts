import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getUserCompletedChallengesByGame(
  ctx: HandlerContextWithPath<'db' | 'logs', '/games/:id/challenges'>
) {
  const {
    components: { db },
    verification,
    params
  } = ctx

  const { id } = params

  // TODO: which endpoints need to be verified ?
  // Because the requests made from the global portable experience can't be validated this way
  // because the PX doesn't have a parcel.
  // Maybe we can validate that is inside genesis ? IDK.

  // await validateSignedFetch(ctx, {})
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
