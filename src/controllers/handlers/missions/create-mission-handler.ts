import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { HandlerContextWithPath, Mission } from '../../../types'

const schema = Joi.object<Mission>().keys({
  description: Joi.string().required(),
  campaign_key: Joi.string().required()
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

  const mission = await db.createMission(validatedBody.description, validatedBody.campaign_key)

  return {
    status: 201,
    body: {
      data: mission
    }
  }
}
