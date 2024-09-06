import { HandlerContextWithPath } from '../../../types'

export async function getMissionsInProgressHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/in_progress'>, 'components' | 'verification'>
) {
  const {
    components: { db },
    verification
  } = ctx

  const userAddress = verification!.auth

  const missions = await db.getMissionsInProgressForUser(userAddress)
  const challenges = await db.getUserChallengesByMissions(
    missions.map(({ id }) => id),
    userAddress
  )
  const ids = challenges.map(({ game_id }) => game_id)
  const games = await db.getGamesById(ids)

  return {
    status: 200,
    body: {
      data: { missions, challenges, games }
    }
  }
}
