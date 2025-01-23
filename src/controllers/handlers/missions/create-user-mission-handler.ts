import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'
import { getMissionsByStatus, MissionStatus } from '../../utils/get-missions-by-status'

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

  const completedData = await getMissionsByStatus(MissionStatus.COMPLETED, verification!.auth, db)
  const lastMission = completedData.missions.sort((m1, m2) => parseInt(m2.start_time) - parseInt(m1.start_time))[0]

  const missionTimeWindow = await config.requireNumber('MISSION_TIME_WINDOW_HS')
  const lastStartTime = lastMission?.start_time || '0'
  const isTimeForNewMission = Date.now() - missionTimeWindow * 60 * 60 * 1000 > parseInt(lastStartTime)

  if (!isTimeForNewMission) {
    logger.warn('Need to wait more time for starting a new mission')
    throw new InvalidRequestError('Need to wait more time for starting a new mission')
  }

  await db.setMissionAsStart(verification!.auth, missionId)

  return {
    status: 204
  }
}
