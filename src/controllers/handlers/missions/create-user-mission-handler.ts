import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function createUserMissionHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/missions/:id/start'>, 'components' | 'params' | 'verification'>
) {
  const {
    components: { logs, db },
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

  try {
    await db.setMissionAsStart(verification!.auth, missionId)

    return {
      status: 204
    }
  } catch (error) {
    logger.warn(`Error trying to start the mission: ${missionId} for the user: ${verification!.auth}`)
    throw new InvalidRequestError(
      `Error trying to start the mission id ${missionId} for the user ${verification!.auth}: ${error}`
    )
  }
}
