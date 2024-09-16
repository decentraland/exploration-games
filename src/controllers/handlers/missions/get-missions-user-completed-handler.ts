import { HandlerContextWithPath } from '../../../types'
import { getMissionsByStatus, MissionStatus } from '../../utils/get-missions-by-status'

export async function getMissionsCompletedHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/completed'>, 'components' | 'verification'>
) {
  const {
    components: { db },
    verification
  } = ctx

  const userAddress = verification!.auth

  const { missions, challenges, games } = await getMissionsByStatus(MissionStatus.COMPLETED, userAddress, db)

  return {
    status: 200,
    body: {
      data: { missions, challenges, games }
    }
  }
}
