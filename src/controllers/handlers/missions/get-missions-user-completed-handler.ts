import { HandlerContextWithPath } from '../../../types'
import { getMissionsByStatus, MissionStatus } from '../../utils/get-missions-by-status'

export async function getMissionsCompletedHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/completed'>, 'components' | 'verification' | 'url'>
) {
  const {
    components: { db },
    verification,
    url
  } = ctx

  const userAddress = verification!.auth
  const type = url.searchParams.get('type') || 'mini-games'

  const { missions, challenges, games } = await getMissionsByStatus(MissionStatus.COMPLETED, type, userAddress, db)
  return {
    status: 200,
    body: {
      data: { missions, challenges, games }
    }
  }
}
