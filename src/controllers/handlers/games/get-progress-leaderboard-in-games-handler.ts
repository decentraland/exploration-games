import { InvalidRequestError } from '@dcl/platform-server-commons'
import { HandlerContextWithPath, ProgressSort, SortDirection } from '../../../types'
import { uuidSchema } from '../../../utils'

export async function getProgressLeaderboardInGamesHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/games/:id/leaderboard'>, 'components' | 'params' | 'url'>
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
  const level = url.searchParams.get('level') as number | null
  const optionSortDirection = url.searchParams.get('direction')?.toLocaleUpperCase() as SortDirection | null
  let limitOption = Number(url.searchParams.get('limit') || 10)
  const optionSort = url.searchParams.get('sort') as Omit<ProgressSort, 'level'> | null

  if (optionSort && !Object.values(ProgressSort).find((sort) => sort === optionSort && sort !== ProgressSort.LEVEL)) {
    throw new InvalidRequestError('Invalid sort option')
  }

  if (limitOption && (limitOption < 1 || limitOption > 10)) {
    limitOption = 10
  }

  const leaderOptions = {
    sort: optionSort || ProgressSort.SCORE,
    direction: optionSortDirection || SortDirection.DESC,
    limit: limitOption,
    level
  }
  const leaderboard = await db.getGameLeaderboard(id, leaderOptions)

  return {
    status: 200,
    body: {
      data: leaderboard
    }
  }
}
