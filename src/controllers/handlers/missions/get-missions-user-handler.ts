import { HandlerContextWithPath } from '../../../types'

export async function getMissionsAvailableHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/available'>, 'components' | 'verification' | 'url'>
) {
  const {
    components: { db },
    verification,
    url
  } = ctx

  const type = url.searchParams.get('type') || 'mini-games'

  const missions = await db.getMissionsAvailableForUser(verification!.auth, type)

  return {
    status: 200,
    body: {
      data: missions
    }
  }
}
