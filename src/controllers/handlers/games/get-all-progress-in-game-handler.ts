import { InvalidRequestError } from '@dcl/platform-server-commons'
import { HandlerContextWithPath, ProgressSort, SortDirection } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getAllProgressInGameHandler(
  ctx: Pick<
    HandlerContextWithPath<'db' | 'logs', '/games/:id/progress/all'>,
    'components' | 'params' | 'verification' | 'url'
  >
) {
  const {
    components: { db },
    params,
    url
  } = ctx

  const { id } = params

  const validateUuid = uuidSchema.validate(id)

  if (validateUuid.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const optionSort = url.searchParams.get('sort') as ProgressSort | null
  const optionSortDirection = url.searchParams.get('direction')?.toLocaleUpperCase() as SortDirection | null
  let limitOption = Number(url.searchParams.get('limit') || 10)

  if (limitOption && (limitOption < 1 || limitOption > 1000)) {
    limitOption = 10
  }

  const progress = await db.getAllProgressInGame(id, {
    sort: optionSort as ProgressSort,
    direction: optionSortDirection || SortDirection.DESC,
    limit: limitOption
  })

  return {
    status: 200,
    body: {
      data: progress
    }
  }
}
