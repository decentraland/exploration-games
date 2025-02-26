import { HandlerContextWithPath, MissionType } from '../../../types'

export async function getMissionsAvailableHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/available'>, 'components' | 'verification' | 'url'>
) {
  const {
    components: { db },
    verification,
    url
  } = ctx

  const type = (url.searchParams.get('type') as MissionType) || MissionType.MINI_GAMES

  const missions = await db.getMissionsAvailableByTypeForUser(verification!.auth, type)

  return {
    status: 200,
    body: {
      data: missions
    }
  }
}
