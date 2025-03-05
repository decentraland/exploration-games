import { HandlerContextWithPath, MissionType } from '../../../types'
import { getMissionsByStatusAndType, MissionStatus } from '../../utils/get-missions-by-status'

export async function getMissionsCompletedHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/completed'>, 'components' | 'verification' | 'url'>
) {
  const {
    components: { db },
    verification,
    url
  } = ctx

  const userAddress = verification!.auth
  const type = (url.searchParams.get('type') as MissionType) || MissionType.MINI_GAMES

  const { missions, challenges, games } = await getMissionsByStatusAndType(
    MissionStatus.COMPLETED,
    type,
    userAddress,
    db
  )
  return {
    status: 200,
    body: {
      data: { missions, challenges, games }
    }
  }
}
