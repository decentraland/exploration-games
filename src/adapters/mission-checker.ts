import { AppComponents, IMissionChecker } from '../types'
import { CronJob } from 'cron'
import { InvalidRequestError } from '@dcl/platform-server-commons'

export async function createMissionChecker(
  components: Pick<AppComponents, 'logs' | 'db' | 'rewardService'>
): Promise<IMissionChecker> {
  const { logs, db, rewardService } = components
  const logger = logs.getLogger(`mission-checker`)
  let job: CronJob

  async function start(): Promise<void> {
    job = new CronJob(
      '0 * * * * *',
      async function () {
        try {
          const yesterday = Date.now() - 86400000

          logger.info(
            `Looking into missions that user started before ${new Date(yesterday).toDateString()} - ${new Date(yesterday).toTimeString()}.`
          )

          const userMissions = await db.getAllUserMissionsActiveStartedOn(yesterday)

          // Avoid exiting the process if one of the checks fails
          const results = await Promise.allSettled(
            userMissions.map(async (userMission) => {
              const challenges = await db.getChallengesByMission(userMission.mission_id)
              if (challenges.length > 0) {
                await db.setChallengesAsExpired(
                  userMission.user_address,
                  challenges.map((challenge) => challenge.id)
                )
              }
              await db.setIncompleteMission(userMission.id)
            })
          )

          const failed = results.filter((result) => result.status === 'rejected')
          if (failed.length > 0) {
            logger.warn(`Error while checking ${failed.length} missions.`)
          }
        } catch (error) {
          logger.warn(`Error while checking missions: ${error}`)
        }
      },
      null,
      false,
      'UCT'
    )
    job.start()
  }

  async function stop() {
    job?.stop()
  }

  async function isMissionComplete(
    missionId: string,
    userAddress: string
  ): Promise<{
    mission: {
      id: string
      description: string
      active: boolean
    }
    reward?: any
    user_mission?: any
  }> {
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
      throw new InvalidRequestError(`There was an error ending the user's mission`)
    }

    if (completedChallenges.length >= challengesByMission.length && allChallengesCompleted) {
      const ended = await db.setMissionAsEnd(userMission[0].id)

      if (!ended.rowCount) {
        logger.warn(`There was an error ending the user's mission: ${userMission[0].id}}`)
        throw new InvalidRequestError(`There was an error ending the user's mission`)
      }

      const rewardResponse = await rewardService.sendReward(campaign_key, userAddress)

      return {
        reward: rewardResponse.data,
        mission
      }
    }

    return {
      mission,
      user_mission: mission
    }
  }

  return {
    start,
    stop,
    isMissionComplete
  }
}
