import { IDatabaseComponent } from '../../adapters/db'
import { MissionCompleted, MissionInProgress } from '../../types'

export enum MissionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

type MissionsGetterByStatus = Record<
  MissionStatus,
  (db: IDatabaseComponent, userAddress: string, type: string) => Promise<MissionInProgress[] | MissionCompleted[]>
>

const missionsGetterByStatus: MissionsGetterByStatus = {
  [MissionStatus.IN_PROGRESS]: async (db: IDatabaseComponent, userAddress: string, type: string) =>
    db.getMissionsInProgressForUser(userAddress, type),
  [MissionStatus.COMPLETED]: async (db: IDatabaseComponent, userAddress: string, type: string) =>
    db.getMissionsCompletedForUser(userAddress, type)
}

export const getMissionsByStatus = async (
  status: MissionStatus,
  type: string,
  userAddress: string,
  db: IDatabaseComponent
) => {
  const missions = await missionsGetterByStatus[status](db, userAddress, type)
  const missionsIds = missions.map(({ id }) => id)
  const challenges = await db.getUserChallengesByMissions(missionsIds, userAddress)
  const challengesIds = challenges.map(({ game_id }) => game_id)
  const games = await db.getGamesById(challengesIds)

  return {
    missions,
    challenges,
    games
  }
}
