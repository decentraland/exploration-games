import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import {
  HandlerContextWithPath,
  MultiplayerPlayerScore,
  NewMultiplayerProgressPayload,
  UserProgress
} from '../../../types'
import { uuidSchema } from '../../../utils'

const scoreSchema = Joi.object<MultiplayerPlayerScore>().keys({
  user_address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/),
  user_name: Joi.string().required(),
  level: Joi.number().required().min(1),
  score: Joi.number().optional(),
  time: Joi.number().optional(),
  moves: Joi.number().optional(),
  data: Joi.object().optional()
})

const schema = Joi.object<NewMultiplayerProgressPayload>().keys({
  game_id: Joi.string().required().uuid(),
  scores: Joi.array().min(1).items(scoreSchema).required()
})

export async function newMultiplayerProgressHandler(
  ctx: HandlerContextWithPath<'db' | 'logs', '/multiplayer/progress'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('new-multiplayer-progress-handler')

  const body = await parseJson<NewMultiplayerProgressPayload>(request)

  const validatePayload = schema.validate(body)
  if (validatePayload.error) {
    logger.warn(
      `Invalid multiplayer progress object received: ${validatePayload.error.message} (${JSON.stringify(body)}`
    )
    throw new InvalidRequestError(validatePayload.error.message)
  }

  const { game_id } = body

  const validateGameId = uuidSchema.validate(game_id)
  if (validateGameId.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const upserted: UserProgress[] = await db.createMultiplayerProgressInGame(body)

  return {
    status: 201,
    body: {
      data: upserted
    }
  }
}
