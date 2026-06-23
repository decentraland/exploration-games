import { InvalidRequestError } from '@dcl/http-commons'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function createUserMissionHandler(
  ctx: Pick<
    HandlerContextWithPath<'db' | 'logs' | 'config', '/missions/:id/start'>,
    'components' | 'params' | 'verification'
  >
) {
  const {
    components: { logs, db, config },
    params,
    verification
  } = ctx

  const { id: missionId } = params
  const logger = logs.getLogger('create-mission-handler')

  const validateMissionId = uuidSchema.validate(missionId)

  if (validateMissionId.error) {
    logger.warn(`Invalid mission UUID received: ${validateMissionId.error.message}}`)
    throw new InvalidRequestError('Invalid UUID')
  }

  const mission = await db.getMission(missionId)

  if (!mission) {
    logger.warn(`No mission found with UUID: ${missionId}`)
    throw new InvalidRequestError('No mission found with this UUID')
  }

  if (!mission.type) {
    logger.warn(`Mission ${missionId} has no type`)
    throw new InvalidRequestError('Mission has no type')
  }

  const isMinigame = mission?.type === 'mini-games'

  const lastMission = await db.getLastMissionForUser(verification!.auth, mission.type)

  if (lastMission && !lastMission.end_time && isMinigame) {
    logger.warn(`Can't start new mission while there is an active mission for this user.`)
    throw new InvalidRequestError(`Can't start new mission while there is an active mission for this user.`)
  } else if (lastMission && !lastMission.end_time && !isMinigame && lastMission.id === missionId) {
    logger.warn(`This mission is already active for this user.`)
    throw new InvalidRequestError(`This mission is already active for this user.`)
  } else if (lastMission && !lastMission.end_time && !isMinigame && lastMission.id !== missionId) {
    await db.setIncompleteMission(lastMission.user_mission_id)
  }

  if (isMinigame && lastMission) {
    const missionTimeWindow = await config.requireNumber('MISSION_TIME_WINDOW_HS')
    const lastStartTime = parseInt(lastMission.start_time || '0')
    const isTimeForNewMission = Date.now() - missionTimeWindow * 60 * 60 * 1000 > lastStartTime

    if (!isTimeForNewMission) {
      logger.warn('Need to wait more time for starting a new mission')
      throw new InvalidRequestError('Need to wait more time for starting a new mission')
    }
  }

  await db.setMissionAsStart(verification!.auth, missionId)

  return {
    status: 204
  }
}
