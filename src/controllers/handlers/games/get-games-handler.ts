import { HandlerContextWithPath } from '../../../types'

export async function getGamesHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/games'>, 'components' | 'url'>
) {
  const {
    components: { db },
    url
  } = ctx

  const allGames = url.searchParams.has('all')

  if (allGames) {
    const games = await db.getAllGames()
    return {
      status: 200,
      body: {
        data: games
      }
    }
  }

  const games = await db.getActiveGames()

  return {
    status: 200,
    body: {
      data: games
    }
  }
}
