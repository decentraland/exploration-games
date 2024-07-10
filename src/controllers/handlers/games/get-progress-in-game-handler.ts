import { InvalidRequestError } from '@dcl/platform-server-commons'
import { HandlerContextWithPath, progressOption } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getProgressInGameHandler(
  ctx: Pick<
    HandlerContextWithPath<'db' | 'logs', '/games/:id/progress'>,
    'components' | 'params' | 'verification' | 'url'
  >
) {
  const {
    components: { db },
    params,
    verification,
    url
  } = ctx

  const { id } = params

  const validateUuid = uuidSchema.validate(id)

  if (validateUuid.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const searchOption = url.searchParams.get('option') as progressOption | null

  let progress = null
  if (searchOption === progressOption.ALL) {
    progress = await db.getAllUserProgressInGame(id, verification!.auth)
  } else {
    progress = await db.getUserProgressInGame(
      id,
      verification!.auth,
      searchOption === progressOption.MAX ? progressOption.MAX : progressOption.LAST
    )
  }

  return {
    status: 200,
    body: {
      data: progress || null
    }
  }
}
