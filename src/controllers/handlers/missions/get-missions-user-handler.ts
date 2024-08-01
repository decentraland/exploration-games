import { HandlerContextWithPath } from '../../../types'

export async function getMissionsAvailableHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/available'>, 'components' | 'verification'>
) {
  const {
    components: { db },
    verification
  } = ctx

  const missions = await db.getMissionsAvailableForUser(verification!.auth)

  return {
    status: 200,
    body: {
      data: missions
    }
  }
}
