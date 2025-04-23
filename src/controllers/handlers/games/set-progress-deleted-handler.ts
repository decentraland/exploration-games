import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { DeleteProgressBody, HandlerContextWithPath } from '../../../types'

const schema = Joi.object<DeleteProgressBody>().keys({
  ids: Joi.array().items(Joi.string()).required(),
  isNull: Joi.bool()
})

export async function setProgressDeletedHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/progress/delete'>, 'components' | 'request'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('set-progress-deleted-handler')

  const body = (await parseJson(request)) as DeleteProgressBody
  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid body when deleting progress: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const deleted = await db.setProgressDeleted(body.ids, body.isNull)

  return {
    status: 200,
    body: {
      data: deleted
    }
  }
}
