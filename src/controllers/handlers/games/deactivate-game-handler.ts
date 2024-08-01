import { HandlerContextWithPath } from '../../../types'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { uuidSchema } from '../../../utils'

export async function deactivateGameHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/:id/deactivate'>, 'components' | 'params'>
) {
  const {
    components: { db },
    params
  } = ctx

  const { id } = params
  console.log(' > game id: > ', id)
  const validationResult = uuidSchema.validate(id)
  console.log(' > validationResult: > ', validationResult)
  if (validationResult.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  await db.deactivateGame(id)

  return {
    status: 204,
    body: {}
  }
}
