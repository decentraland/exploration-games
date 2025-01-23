import { InvalidRequestError } from '@dcl/platform-server-commons'
import { ILoggerComponent } from '@well-known-components/interfaces'
import { IDatabaseComponent } from '../../adapters/db'
import { IRewardComponent } from '../../types'

export async function checkCompleteMission(
  missionsId: string,
  userAddress: string,
  db: IDatabaseComponent,
  rewardService: IRewardComponent,
  logger: ILoggerComponent.ILogger
) {
  const challengesByMission = await db.getChallengesByMission(missionsId)
  const completedChallenges = await db.getUserChallengeCompleted(
    userAddress,
    challengesByMission.map(({ id }) => id)
  )

  const completedChallengeIds = new Set(completedChallenges.map(({ challenge_id }) => challenge_id))
  const allChallengesCompleted = challengesByMission.every(({ id }) => completedChallengeIds.has(id))
  const userMission = await db.getUserMissions(userAddress, { missionId: missionsId, active: true })
  const { campaign_key, ...mission } = await db.getMissionWithCampaignKeyExposure(missionsId)

  if (completedChallenges.length >= challengesByMission.length && allChallengesCompleted) {
    const ended = await db.setMissionAsEnd(userMission[0].id)

    if (ended.rowCount === 0) {
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
