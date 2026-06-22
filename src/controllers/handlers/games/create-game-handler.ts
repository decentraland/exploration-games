import Joi from 'joi'
import { InvalidRequestError, parseJson } from '@dcl/http-commons'
import { CreateGamePayload, HandlerContextWithPath } from '../../../types'

const schema = Joi.object<CreateGamePayload>().keys({
  name: Joi.string().required(),
  x: Joi.number().required().min(-150).max(150),
  y: Joi.number().required().min(-150).max(150)
})

export async function createGameHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games'>, 'components' | 'request'>
) {
  const {
    components: { logs, db },
    request
  } = ctx

  const logger = logs.getLogger('create-game-handler')

  const body = await parseJson(request)

  const validate = schema.validate(body)
  if (validate.error) {
    logger.warn(`Invalid creation game object received: ${validate.error.message} (${JSON.stringify(body)}`)
    throw new InvalidRequestError(validate.error.message)
  }

  const validatedBody = body as CreateGamePayload

  const game = await db.createGame(validatedBody.name, `${validatedBody.x},${validatedBody.y}`)

  return {
    status: 201,
    body: {
      data: game
    }
  }
}
