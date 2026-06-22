import Joi from 'joi'
import { InvalidRequestError, parseJson } from '@dcl/http-commons'
import { HandlerContextWithPath, ProgressStatusBody } from '../../../types'

const schema = Joi.object<ProgressStatusBody>().keys({
  ids: Joi.array().items(Joi.string().uuid()).required(),
  disabled: Joi.boolean().required()
})

export async function setProgressStatusHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/progress/status'>, 'components' | 'request'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('set-progress-status-handler')

  const body = (await parseJson(request)) as ProgressStatusBody
  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid body when setting progress status: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const results = await db.setProgressStatus(body.ids, body.disabled)

  return {
    status: 200,
    body: {
      data: results
    }
  }
}
