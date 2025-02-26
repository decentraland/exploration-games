import { HandlerContextWithPath, MissionType } from '../../../types'
import { getMissionsByStatusAndType, MissionStatus } from '../../utils/get-missions-by-status'

export async function getMissionsInProgressHandler(
  ctx: Pick<HandlerContextWithPath<'db', '/missions/in_progress'>, 'components' | 'verification' | 'url'>
) {
  const {
    components: { db },
    verification,
    url
  } = ctx

  const type = (url.searchParams.get('type') as MissionType) || MissionType.MINI_GAMES

  const userAddress = verification!.auth

  const { missions, challenges, games } = await getMissionsByStatusAndType(
    MissionStatus.IN_PROGRESS,
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
