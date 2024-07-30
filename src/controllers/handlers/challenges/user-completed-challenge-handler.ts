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

  const challengesByMission = await db.getChallengesByMission(challenge.mission_id)
  const completedChallenges = await db.getUserChallengeCompleted(
    verification!.auth,
    challengesByMission.map(({ id }) => id)
  )

  const completedChallengeIds = new Set(completedChallenges.map(({ challenge_id }) => challenge_id))
  const allChallengesCompleted = challengesByMission.every(({ id }) => completedChallengeIds.has(id))

  if (completedChallenges.length >= challengesByMission.length && allChallengesCompleted) {
    const userMission = await db.getUserMissions(verification!.auth, { missionId: challenge.mission_id, active: true })

    await db.setMissionAsEnd(userMission[0].id)

    const mission = await db.getMissionWithCampaignKeyExposure(challenge.mission_id)

    const rewardResponse = await rewardService.sendReward(mission.campaignKey, verification!.auth)

    return {
      status: 201,
      body: rewardResponse
    }
  }

  return {
    status: 204
  }
}
