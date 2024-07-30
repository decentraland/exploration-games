import { HandlerContextWithPath } from '../../../types'

export async function getMissionHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/missions/:id'>, 'components' | 'params'>
) {
  const {
    components: { db },
    params
  } = ctx

  const { id } = params

  const mission = await db.getMission(id)
  const challenges = await db.getChallengesByMission(id)
  const ids = challenges.map(({ game_id }) => game_id)
  const games = await db.getGamesById(ids)

  return {
    status: 200,
    body: {
      data: { mission, challenges, games }
    }
  }
}
