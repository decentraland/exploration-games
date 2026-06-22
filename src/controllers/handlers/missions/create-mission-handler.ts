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

export async function createMissionHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/missions'>, 'components' | 'request'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('create-mission-handler')

  const body = await parseJson(request)

  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid mission object received when creating: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const validatedBody = body as Mission

  const mission = await db.createMission(
    validatedBody.description,
    validatedBody.campaign_key,
    validatedBody.type,
    validatedBody.thumb_url
  )

  return {
    status: 201,
    body: {
      data: mission
    }
  }
}
