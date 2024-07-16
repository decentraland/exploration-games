import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function userCompletedChallengeHandler(
  ctx: Pick<
    HandlerContextWithPath<'db' | 'rewardService' | 'logs', '/challenges/:id'>,
    'components' | 'params' | 'verification'
  >
) {
  const {
    components: { db, rewardService },
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

  const rewardResponse = await rewardService.sendReward(challenge.campaign_key, verification!.auth)

  return {
    status: 201,
    body: rewardResponse
  }
}
