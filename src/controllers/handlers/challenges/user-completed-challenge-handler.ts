import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function userCompletedChallengeHandler(
  ctx: Pick<
    HandlerContextWithPath<'db' | 'reward' | 'logs', '/challenges/:id'>,
    'components' | 'params' | 'verification'
  >
) {
  const {
    components: { db, reward },
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

  await db.userCompletedChallenge(verification!.auth, id)

  const rewardResponse = await reward.sendReward(challenge.campaign_key, verification!.auth)

  return {
    status: 201,
    body: rewardResponse
  }
}
