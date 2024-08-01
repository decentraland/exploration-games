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
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)

          logger.info(`Looking into missions that user stared before ${yesterday.toDateString()}.`)

          const userMissions = await db.getAllUserMissionsActive()
          for (const userMission of userMissions) {
            const challenges = await db.getChallengesByMission(userMission.mission_id)
            if (challenges.length > 0) {
              await db.setChallengesAsExpired(
                userMission.user_address,
                challenges.map((challenge) => challenge.id)
              )
            }
            await db.setIncompleteMission(userMission.id)
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
