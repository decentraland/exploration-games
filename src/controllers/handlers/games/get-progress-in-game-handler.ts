import { InvalidRequestError } from '@dcl/platform-server-commons'
import { HandlerContextWithPath, progressSort } from '../../../types'
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

  const sortOption = url.searchParams.get('sort') as progressSort | null
  const LimitOption = url.searchParams.get('limit') as 'all' | number | null
  console.log(LimitOption)

  // if (sortOption === progressSort.ALL) {
  // progress = await db.getAllUserProgressInGame(id, verification!.auth)
  // } else {
  const progress = await db.getUserProgressInGame(id, verification!.auth, {
    sort: sortOption as progressSort,
    limit: 1
  })
  // }

  return {
    status: 200,
    body: {
      data: progress || null
    }
  }
}
