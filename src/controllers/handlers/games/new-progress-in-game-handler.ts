import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { AppComponents, BaseComponents, HandlerContextWithPath, NewProgressInGamePayload } from '../../../types'
import { uuidSchema } from '../../../utils'
import { validateSignedFetch } from '../../middlewares/validate-signed-fetch'

const schema = Joi.object<NewProgressInGamePayload>().keys({
  user_name: Joi.string().required(),
  level: Joi.number().required().min(1),
  score: Joi.number().optional(),
  time: Joi.number().optional(),
  moves: Joi.number().optional(),
  data: Joi.object().optional()
})

export async function newProgressInGameHandler(
  ctx: HandlerContextWithPath<keyof BaseComponents, '/games/:id/progress'>
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

  // Validate signed fetch
  await validateSignedFetch(ctx, { body, gameId: validateGameId.value })

  const progress = await db.createProgressInGame(
    id,
    {
      userAddress: verification!.auth,
      userName: body.user_name
    },
    { level: body.level, score: body.score, time: body.time, moves: body.moves },
    body.data
  )

  return {
    status: 201,
    body: {
      data: progress
    }
  }
}
