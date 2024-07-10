import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

type NewProgressInGamePayload = {
  level: number
  score: number
  data?: Record<string, any>
}

const schema = Joi.object<NewProgressInGamePayload>().keys({
  level: Joi.number().required().min(1),
  score: Joi.number().required(),
  data: Joi.object().optional()
})

export async function newProgressInGameHandler(
  ctx: Pick<
    HandlerContextWithPath<'db' | 'logs', '/games/:id/progress'>,
    'components' | 'request' | 'params' | 'verification'
  >
) {
  const {
    components: { logs, db },
    request,
    params,
    verification
  } = ctx

  const logger = logs.getLogger('new-progress-in-game-handler')

  const { id } = params

  const body = await parseJson<NewProgressInGamePayload>(request)

  const validateGameId = uuidSchema.validate(id)
  if (validateGameId.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const validatePayload = schema.validate(body)
  if (validatePayload.error) {
    logger.warn(
      `Invalid new progress in game object received: ${validatePayload.error.message} (${JSON.stringify(body)}`
    )
    throw new InvalidRequestError(validatePayload.error.message)
  }

  const progress = await db.upsertProgressInGame(id, verification!.auth, body.level, body.score, body.data)

  return {
    status: 201,
    body: {
      data: progress
    }
  }
}
