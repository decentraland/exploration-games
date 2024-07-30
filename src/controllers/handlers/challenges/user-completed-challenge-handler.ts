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
    components: { db, rewardService, logs },
    verification,
    params
  } = ctx

  const { id } = params

  const logger = logs.getLogger('user-completed-challenge-handler')

  const validateId = uuidSchema.validate(id)

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

  const challengesByMission = await db.getChallengesByMission(challenge.mission_id)
  const completedChallenges = await db.getUserChallengeCompleted(
    verification!.auth,
    challengesByMission.map(({ id }) => id)
  )

  const completedChallengeIds = new Set(completedChallenges.map(({ challenge_id }) => challenge_id))
  const allChallengesCompleted = challengesByMission.every(({ id }) => completedChallengeIds.has(id))
  const userMission = await db.getUserMissions(verification!.auth, { missionId: challenge.mission_id, active: true })
  const { campaign_key, ...mission } = await db.getMissionWithCampaignKeyExposure(challenge.mission_id)

  if (completedChallenges.length >= challengesByMission.length && allChallengesCompleted) {
    const ended = await db.setMissionAsEnd(userMission[0].id)

    if (ended.rowCount === 0) {
      logger.warn(`There was an error ending the user's mission: ${userMission[0].id}}`)
      throw new InvalidRequestError(`There was an error ending the user's mission`)
    }

    const rewardResponse = await rewardService.sendReward(campaign_key, verification!.auth)

    return {
      status: 200,
      body: {
        data: {
          reward: rewardResponse.data,
          mission,
          user_mission: userMission[0]
        }
      }
    }
  }

  return {
    status: 200,
    body: {
      data: {
        mission,
        user_mission: userMission[0]
      }
    }
  }
}
