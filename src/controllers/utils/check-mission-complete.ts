import { InvalidRequestError } from '@dcl/platform-server-commons'
import { BaseComponents } from '../../types'

export async function checkCompleteMission(
  components: Pick<BaseComponents, 'db' | 'rewardService' | 'logs'>,
  missionId: string,
  userAddress: string
) {
  const { logs, db, rewardService } = components

  const logger = logs.getLogger('check-mission-complete')

  const challengesByMission = await db.getChallengesByMission(missionId)
  const completedChallenges = await db.getUserChallengeCompleted(
    userAddress,
    challengesByMission.map(({ id }) => id)
  )

  const completedChallengeIds = new Set(completedChallenges.map(({ challenge_id }) => challenge_id))
  const allChallengesCompleted = challengesByMission.every(({ id }) => completedChallengeIds.has(id))
  const userMission = await db.getUserMissions(userAddress, { missionId, active: true })
  const { campaign_key, ...mission } = await db.getMissionWithCampaignKeyExposure(missionId)

  if (!userMission.length) {
    logger.warn(`There was an error ending the user's mission: ${mission.id}}, missing userMission`)
    throw new InvalidRequestError(`There was an error ending the user's mission, missing userMission`)
  }

  if (completedChallenges.length >= challengesByMission.length && allChallengesCompleted) {
    const ended = await db.setMissionAsEnd(userMission[0].id)

    if (!ended.rowCount) {
      logger.warn(`There was an error ending the user's mission: ${userMission[0].id}}`)
      throw new InvalidRequestError(`There was an error ending the user's mission`)
    }

    const rewardResponse = await rewardService.sendReward(campaign_key, userAddress)

    return {
      status: 200,
      body: {
        data: {
          reward: rewardResponse.data,
          mission,
          user_mission: userMission[0].id
        }
      }
    }
  }

  return {
    status: 200,
    body: {
      data: {
        mission,
        user_mission: mission
      }
    }
  }
}
