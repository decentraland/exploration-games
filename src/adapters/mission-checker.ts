import { AppComponents, IMissionChecker } from '../types'
import { CronJob } from 'cron'

export async function createMissionChecker(components: Pick<AppComponents, 'logs' | 'db'>): Promise<IMissionChecker> {
  const { logs, db } = components
  const logger = logs.getLogger(`mission-checker`)

  async function start(): Promise<void> {
    const job = new CronJob(
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

  return {
    start
  }
}
