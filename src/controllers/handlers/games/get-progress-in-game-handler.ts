import { InvalidRequestError } from '@dcl/platform-server-commons'
import { HandlerContextWithPath } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getProgressInGameHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games/:id/progress'>, 'components' | 'params' | 'verification'>
) {
  const {
    components: { db },
    params,
    verification
  } = ctx

  const { id } = params

  const validateUuid = uuidSchema.validate(id)

  if (validateUuid.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const progress = await db.getUserProgressInGame(id, verification!.auth)

  return {
    status: 200,
    body: {
      data: progress || null
    }
  }
}
