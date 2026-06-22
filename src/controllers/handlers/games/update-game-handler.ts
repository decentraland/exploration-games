import Joi from 'joi'
import { InvalidRequestError, parseJson } from '@dcl/http-commons'
import { CreateGamePayload, HandlerContextWithPath } from '../../../types'

const schema = Joi.object<CreateGamePayload>().keys({
  name: Joi.string().required(),
  x: Joi.number().required().min(-150).max(150),
  y: Joi.number().required().min(-150).max(150)
})

export async function updateGameHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/:id'>, 'components' | 'request' | 'params'>
) {
  const {
    components: { logs, db },
    params,
    request
  } = ctx

  const logger = logs.getLogger('update-game-handler')

  const { id } = params
  const body = await parseJson(request)

  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid creation game object received: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const game = await db.getGame(id)

  if (!game) {
    logger.warn(`Game not found when updating id: ${id}`)
    throw new InvalidRequestError('Game not found')
  }

  const validatedBody = body as CreateGamePayload

  try {
    await db.updateGame(game.id, validatedBody.name, `${validatedBody.x},${validatedBody.y}`)
  } catch (error) {
    logger.error(`Error updating game: ${error}`)
    throw new InvalidRequestError('Error updating game')
  }

  return {
    status: 204
  }
}
