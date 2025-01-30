import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'
import { validateSignedFetch } from '../../middlewares/validate-signed-fetch'

export async function userCompletedChallengeHandler(
  ctx: Pick<
    HandlerContextWithPath<'db' | 'rewardService' | 'logs' | 'missionChecker', '/challenges/:id'>,
    'components' | 'params' | 'verification'
  >
) {
  const {
    components: { db, logs, missionChecker },
    verification,
    params
  } = ctx

  const { id } = params

  const logger = logs.getLogger('user-completed-challenge-handler')
  const validateId = uuidSchema.validate(id)

  await validateSignedFetch(ctx, { validateParcel: false })

  if (validateId.error) {
    logger.warn(`Invalid UUID: ${validateId.error}`)
    throw new InvalidRequestError('Invalid UUID')
  }

  const challenge = await db.getChallenge(id)

  if (!challenge) {
    logger.warn(`Challenge id ${id} doesn't exist`)
    throw new InvalidRequestError(`${id} doesn't exist`)
  }

  await db.setChallengeAsComplete(verification!.auth, id)
  const result = await missionChecker.isMissionComplete(challenge.mission_id, verification!.auth)

  return {
    status: 200,
    body: {
      data: result
    }
  }
}
