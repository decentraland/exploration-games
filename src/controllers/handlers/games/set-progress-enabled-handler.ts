import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { DisableProgressBody, HandlerContextWithPath } from '../../../types'

const schema = Joi.object<DisableProgressBody>().keys({
  ids: Joi.array().items(Joi.string().uuid()).required()
})

export async function setProgressEnableddHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/progress/enable'>, 'components' | 'request'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('set-progress-enabled-handler')

  const body = (await parseJson(request)) as DisableProgressBody
  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid body when enabling progress: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const disabled = await db.setProgressEnabled(body.ids)

  return {
    status: 200,
    body: {
      data: disabled
    }
  }
}
