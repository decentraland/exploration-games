import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { DisableProgressBody, HandlerContextWithPath } from '../../../types'

const schema = Joi.object<DisableProgressBody>().keys({
  ids: Joi.array().items(Joi.string().uuid()).required()
})

export async function setProgressDisabledHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/progress/disable'>, 'components' | 'request'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('set-progress-disabled-handler')

  const body = (await parseJson(request)) as DisableProgressBody
  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid body when disabling progress: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const disabled = await db.setProgressDisabled(body.ids)

  return {
    status: 200,
    body: {
      data: disabled
    }
  }
}
