import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { HandlerContextWithPath } from '../../../types'

type CreateChallengePayload = {
  description: string
}

type CreateChallengeWithGame = CreateChallengePayload & {
  gameId: string
}

const schema = Joi.object<CreateChallengeWithGame>().keys({
  description: Joi.string().required(),
  gameId: Joi.string().required().uuid()
})

export async function createChallengeHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/:id/challenges'>, 'components' | 'request' | 'params'>
) {
  const {
    components: { logs, db },
    request,
    params
  } = ctx

  const logger = logs.getLogger('create-challenge-handler')

  const { id } = params

  const body = await parseJson<CreateChallengePayload>(request)

  const bodyWithGameId: CreateChallengeWithGame = { ...body, gameId: id }

  const validate = schema.validate(bodyWithGameId)
  if (validate.error) {
    logger.warn(`Invalid creation challenge object received: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const game = await db.getGame(bodyWithGameId.gameId)

  if (!game) {
    logger.error('Trying to create a challenge for a non existing game')
    throw new InvalidRequestError(`${bodyWithGameId.gameId} doesn't exist`)
  }

  const challenge = await db.createGameChallenge(bodyWithGameId.gameId, bodyWithGameId.description)

  return {
    status: 201,
    body: {
      data: challenge
    }
  }
}
