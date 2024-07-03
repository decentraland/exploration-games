import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { HandlerContextWithPath } from '../../../types'

type CreateChallengePayload = {
  description: string
  gameId: string
  targetLevel: number
}

const schema = Joi.object<CreateChallengePayload>().keys({
  description: Joi.string().required(),
  targetLevel: Joi.number().required().min(1),
  gameId: Joi.string().required().uuid()
})

export async function createChallengeHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/challenges'>, 'components' | 'request'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('create-challenge-handler')

  const body = await parseJson(request)

  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid creation challenge object received: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const validatedBody = body as CreateChallengePayload

  const game = await db.getGame(validatedBody.gameId)

  if (!game) {
    logger.error('Trying to create a challenge for a non existing game')
    throw new InvalidRequestError(`${validatedBody.gameId} doesn't exist`)
  }

  if (validatedBody.targetLevel > game.max_levels) {
    logger.error('Trying to create a challenge that exceeds the max levels of the game')
    throw new InvalidRequestError(`${validatedBody.targetLevel} exceeds the max levels of ${validatedBody.gameId} game`)
  }

  const challenge = await db.createGameChallenge(
    validatedBody.gameId,
    validatedBody.description,
    validatedBody.targetLevel
  )

  return {
    status: 201,
    body: {
      challenge
    }
  }
}
