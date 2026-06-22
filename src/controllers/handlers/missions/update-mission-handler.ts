import Joi from 'joi'
import { InvalidRequestError, parseJson } from '@dcl/http-commons'
import { HandlerContextWithPath, Mission, MissionType } from '../../../types'

const schema = Joi.object<Mission>().keys({
  description: Joi.string().required(),
  campaign_key: Joi.string().required(),
  type: Joi.string()
    .valid(...Object.values(MissionType))
    .required(),
  thumb_url: Joi.string().required()
})

export async function updateMissionHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/missions:id'>, 'components' | 'request' | 'params'>
) {
  const {
    components: { logs, db },
    params,
    request
  } = ctx

  const logger = logs.getLogger('update-mission-handler')
  const { id } = params

  const body = await parseJson(request)

  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid mission object received when updating: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const validatedBody = body as Mission

  const mission = await db.getMission(id)

  if (!mission) {
    logger.warn(`Mission not found when updating id: ${id}`)
    throw new InvalidRequestError('Mission not found')
  }

  try {
    await db.updateMission(
      mission.id,
      validatedBody.description,
      validatedBody.campaign_key,
      validatedBody.type,
      validatedBody.thumb_url
    )
  } catch (error) {
    logger.error(`Error updating mission: ${error}`)
    throw new InvalidRequestError('Error updating mission')
  }

  return {
    status: 204
  }
}
