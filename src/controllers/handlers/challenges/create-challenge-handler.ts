import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { CreateChallengePayload, HandlerContextWithPath } from '../../../types'

const schema = Joi.object<CreateChallengePayload>().keys({
  description: Joi.string().required(),
  targetLevel: Joi.number().required().min(1),
  missionId: Joi.string().required().uuid(),
  data: Joi.object().optional(),
  gameId: Joi.string().required().uuid()
})

export async function createChallengeHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/challenges'>, 'components' | 'request' | 'params'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('create-challenge-handler')

  const body = await parseJson<CreateChallengePayload>(request)

  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid creation challenge object received: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const game = await db.getGame(body.gameId)

  if (!game) {
    logger.error('Trying to create a challenge for a non existing game')
    throw new InvalidRequestError(`${body.gameId} doesn't exist`)
  }

  const challenge = await db.createGameChallenge(
    body.gameId,
    body.description,
    body.targetLevel,
    body.missionId,
    body.data
  )

  return {
    status: 201,
    body: {
      data: challenge
    }
  }
}
