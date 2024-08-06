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

export async function updateChallengeHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/challenges/:id'>, 'components' | 'request' | 'params'>
) {
  const {
    components: { logs, db },
    params,
    request
  } = ctx

  const logger = logs.getLogger('update-challenge-handler')
  const { id } = params
  const body = await parseJson<CreateChallengePayload>(request)

  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid creation challenge object received: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const challenge = await db.getChallenge(id)

  if (!challenge) {
    logger.warn(`Challenge not found when updating id: ${id}`)
    throw new InvalidRequestError('Challenge not found')
  }

  const game = await db.getGame(body.gameId)

  if (!game) {
    logger.warn('Trying to create a challenge for a non existing game')
    throw new InvalidRequestError(`${body.gameId} doesn't exist`)
  }

  try {
    await db.updateGameChallenge(challenge.id, {
      gameId: body.gameId,
      description: body.description,
      targetLevel: body.targetLevel,
      missionId: body.missionId,
      data: body.data
    })
  } catch (error) {
    logger.error(`Error updating challenge: ${error}`)
    throw new InvalidRequestError('Error updating challenge')
  }

  return {
    status: 204
  }
}
