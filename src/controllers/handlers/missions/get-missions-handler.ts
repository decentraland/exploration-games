import { HandlerContextWithPath } from '../../../types'

export async function getMissionsHandler(
  ctx: Pick<HandlerContextWithPath<'db' | 'logs', '/missions'>, 'components' | 'url'>
) {
  const {
    components: { db },
    url
  } = ctx

  const allMissions = url.searchParams.has('all')

  let missions = []
  if (allMissions) {
    missions = await db.getMissions()
  } else {
    missions = await db.getActiveMissions()
  }

  return {
    status: 200,
    body: {
      data: missions
    }
  }
}
