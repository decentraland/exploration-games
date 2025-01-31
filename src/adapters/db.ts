import SQL from 'sql-template-strings'
import { randomUUID } from 'crypto'
import {
  AppComponents,
  Challenge,
  Game,
  GameMetrics,
  GamePlayedByUser,
  Mission,
  UserMission,
  ProgressSort,
  SortDirection,
  UserProgress,
  UserChallenge,
  MissionInProgress,
  ChallengeWithCompletionTime,
  MissionCompleted
} from '../types'

export interface IDatabaseComponent {
  createGame(name: string, parcel: string): Promise<Game>
  updateGame(id: string, name: string, parcel: string): Promise<void>
  getGame(gameId: string): Promise<Game>
  getGamesById(gamesId: string[]): Promise<Game[]>
  getAllGames(): Promise<Game[]>
  getActiveGames(): Promise<Game[]>
  deactivateGame(gameId: string): Promise<void>
  createMission(description: string, campaign_key: string): Promise<Mission>
  updateMission(id: string, description: string, campaign_key: string): Promise<void>
  getMission(missionId: string): Promise<Mission>
  getMissions(): Promise<Mission[]>
  getActiveMissions(): Promise<Mission[]>
  getMissionsAvailableForUser(userAddress: string): Promise<Mission[]>
  getMissionsInProgressForUser(userAddress: string): Promise<MissionInProgress[]>
  getMissionsCompletedForUser(userAddress: string): Promise<MissionCompleted[]>
  getLastMissionForUser(userAddress: string): Promise<MissionCompleted | null>
  deactivateMission(missionId: string): Promise<void>
  getUserProgressInGame(
    gameId: string,
    userAddress: string,
    option: { sort: ProgressSort; direction: SortDirection; limit: number }
  ): Promise<UserProgress[]>
  createProgressInGame(
    gameId: string,
    userData: {
      userAddress: string
      userName: string
    },
    gameMetrics: GameMetrics,
    data?: Record<string, any> | null
  ): Promise<UserProgress>
  getAllGamesBeingPlayedByUser(userAddress: string): Promise<GamePlayedByUser[]>
  getGameLeaderboard(
    gameId: string,
    options: {
      sort: Omit<ProgressSort, 'level'>
      direction: SortDirection
      limit: number
      level: number | null
    }
  ): Promise<GamePlayedByUser[]>
  createGameChallenge(gameValues: {
    gameId: string
    description: string
    targetLevel: number
    missionId: string
    data?: Record<string, any> | null
  }): Promise<Challenge>
  updateGameChallenge(
    challengeId: string,
    gameValues: {
      gameId: string
      description: string
      targetLevel: number
      missionId: string
      data?: Record<string, any> | null
    }
  ): Promise<void>
  getActiveChallengesForGame(gameId: string): Promise<Challenge[]>
  deactivateGameChallenge(challengeId: string): Promise<void>
  setChallengeAsComplete(userAddress: string, challengeId: string): Promise<void>
  setChallengesAsExpired(userAddress: string, challengesId: string[]): Promise<void>
  setMissionAsStart(userAddress: string, missionId: string): Promise<void>
  setMissionAsEnd(userMissionId: string): Promise<Record<'rows' | 'rowCount', any>>
  setIncompleteMission(userMissionId: string): Promise<void>
  getUserMissions(userAddress: string, options?: { active?: boolean; missionId?: string }): Promise<UserMission[]>
  getAllUserMissionsActiveStartedOn(date: number): Promise<UserMission[]>
  getChallenge(challengeId: string): Promise<Challenge>
  getChallengesByMission(missionId: string): Promise<Challenge[]>
  getUserChallengesByMissions(missionsId: string[], userAddress: string): Promise<ChallengeWithCompletionTime[]>
  getMissionWithCampaignKeyExposure(missionId: string): Promise<Mission>
  getUserCompletedChallengeByGame(
    gameId: string,
    userAddress: string
  ): Promise<Pick<Challenge, 'game_id' | 'id' | 'description'>[]>
  getUserChallengeCompleted(userAddress: string, challengeId: string[]): Promise<UserChallenge[]>
  deleteMissions(missionIds: string[]): Promise<void>
  deleteChallenges(challengeIds: string[]): Promise<void>
  deleteGames(gameIds: string[]): Promise<void>
}

export function createDBComponent(components: Pick<AppComponents, 'pg'>): IDatabaseComponent {
  const { pg } = components

  return {
    async createGame(name: string, parcel: string) {
      const uuid = randomUUID()
      const results = await pg.query<Game>(
        SQL`INSERT INTO games (id, name, parcel) VALUES (${uuid}, ${name}, ${parcel}) RETURNING *`
      )

      return results.rows[0]
    },
    async updateGame(id: string, name: string, parcel: string) {
      await pg.query<Game>(SQL`UPDATE games SET name = ${name}, parcel=${parcel} WHERE id=${id}`)
    },
    async getGame(gameId: string) {
      const results = await pg.query<Game>(SQL`SELECT * FROM games WHERE id = ${gameId}`)

      return results.rows[0]
    },
    async getGamesById(gamesId: string[]) {
      const query = SQL`SELECT * FROM games WHERE`

      query.append(SQL` id = ${gamesId[0]}`)
      for (let i = 1; i < gamesId.length; i++) {
        query.append(SQL` OR id = ${gamesId[i]}`)
      }
      const results = await pg.query<Game>(query)

      return results.rows
    },
    async getActiveGames() {
      const results = await pg.query<Game>(SQL`SELECT * FROM games WHERE active IS TRUE`)

      return results.rows
    },
    async getAllGames() {
      const results = await pg.query<Game>(SQL`SELECT * FROM games`)

      return results.rows
    },
    async deactivateGame(gameId: string) {
      await pg.query(SQL`UPDATE games SET active = false WHERE id = ${gameId}`)
    },
    async getMission(missionId) {
      const results = await pg.query<Mission>(
        SQL`SELECT m.id, m.description, m.active FROM missions m WHERE id = ${missionId}`
      )

      return results.rows[0]
    },
    async getActiveMissions() {
      const results = await pg.query<Mission>(
        SQL`SELECT m.id, m.description, m.active FROM missions m WHERE m.active IS TRUE`
      )

      return results.rows
    },
    async getMissionsAvailableForUser($userAddress: string) {
      const results = await pg.query<Mission>(
        SQL`
          SELECT m.id, m.description, m.active FROM missions m 
          WHERE m.active is true 
          AND m.id not in 
          (
            SELECT um.mission_id FROM user_missions um 
            WHERE um.active IS TRUE and um.end_time IS not NULL and um.user_address = ${$userAddress.toLocaleLowerCase()}
          )`
      )

      return results.rows
    },
    async getMissionsInProgressForUser($userAddress: string) {
      const results = await pg.query<MissionInProgress>(
        SQL`
          SELECT m.id, m.description, m.active, um.start_time
          FROM missions m
          JOIN user_missions um ON m.id = um.mission_id
          WHERE m.active is TRUE
            AND um.active IS TRUE AND um.end_time IS NULL AND um.user_address = ${$userAddress.toLocaleLowerCase()}`
      )

      return results.rows
    },
    async getMissionsCompletedForUser($userAddress: string) {
      const results = await pg.query<MissionCompleted>(
        SQL`
          SELECT m.id, m.description, m.active, um.start_time, um.end_time
          FROM missions m
          JOIN user_missions um ON m.id = um.mission_id
          WHERE m.active is TRUE AND um.active IS TRUE AND um.end_time IS NOT NULL AND um.user_address = ${$userAddress.toLocaleLowerCase()}`
      )

      return results.rows
    },
    async getLastMissionForUser($userAddress: string) {
      const results = await pg.query<MissionCompleted>(
        SQL`
          SELECT m.id, m.description, m.active, um.start_time, um.end_time
          FROM missions m
          JOIN user_missions um ON m.id = um.mission_id
          WHERE m.active is TRUE AND um.active IS TRUE AND um.user_address = ${$userAddress.toLocaleLowerCase()}
          ORDER BY um.start_time DESC
          LIMIT 1`
      )

      return results.rows[0]
    },
    async getMissions() {
      const results = await pg.query<Mission>(SQL`SELECT m.id, m.description, m.active FROM missions m`)

      return results.rows
    },
    async deactivateMission(missionId: string) {
      await pg.query(SQL`UPDATE missions SET active = false WHERE id = ${missionId}`)
    },
    async getUserProgressInGame(gameId, userAddress, option) {
      const query = SQL`
        SELECT * 
        FROM progress 
        WHERE game_id = ${gameId} 
          AND user_address = ${userAddress.toLocaleLowerCase()} 
      `

      const orderOption: ProgressSort =
        Object.values(ProgressSort).find((sort) => sort === option.sort) || ProgressSort.LATEST

      const direction = option.direction === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC

      query.append(`ORDER BY ${orderOption} ${direction} `)

      query.append(SQL`LIMIT ${option.limit}`)

      const results = await pg.query<UserProgress>(query)
      return results.rows
    },
    async createProgressInGame(
      gameId: string,
      userData: {
        userAddress: string
        userName: string
      },
      gameMetrics: GameMetrics,
      data?: Record<string, any> | null
    ) {
      const uuid = randomUUID()
      const { userAddress, userName } = userData
      const { level, score, time, moves } = gameMetrics
      const results = await pg.query<UserProgress>(
        SQL`INSERT INTO progress (id, game_id, user_address, user_name, level, score, time, moves, data, updated_at) 
            VALUES (${uuid}, ${gameId}, ${userAddress.toLocaleLowerCase()}, ${userName}, ${level}, ${score}, ${time}, ${moves}, ${data}, ${Date.now()})
            RETURNING *
          `
      )

      return results.rows[0]
    },
    async createGameChallenge(gameValues: {
      gameId: string
      description: string
      targetLevel: number
      missionId: string
      data?: Record<string, any> | null
    }) {
      const uuid = randomUUID()
      const { gameId, description, targetLevel, missionId, data } = gameValues
      const results = await pg.query<Challenge>(
        SQL`INSERT INTO challenges (id, game_id, description, target_level, mission_id, data) 
          VALUES (${uuid}, ${gameId}, ${description}, ${targetLevel}, ${missionId}, ${data}) 
        RETURNING *`
      )

      return results.rows[0]
    },
    async updateGameChallenge(
      challengeId: string,
      gameValues: {
        gameId: string
        description: string
        targetLevel: number
        missionId: string
        data?: Record<string, any> | null
      }
    ) {
      const { gameId, description, targetLevel, missionId, data } = gameValues
      await pg.query(
        SQL`
          UPDATE challenges 
          SET game_id = ${gameId}, description = ${description}, target_level = ${targetLevel}, mission_id = ${missionId}, data = ${data}
          WHERE id = ${challengeId}
        `
      )
    },
    async getActiveChallengesForGame(gameId: string) {
      const results = await pg.query<Challenge>(
        SQL`SELECT c.id, c.description, c.game_id, c.mission_id, c.target_level, c.data, c.active FROM challenges c WHERE active IS TRUE AND game_id = ${gameId}`
      )
      return results.rows
    },
    async deactivateGameChallenge(challengeId: string) {
      await pg.query(SQL`UPDATE challenges SET active = false WHERE id = ${challengeId}`)
    },
    async setChallengeAsComplete(userAddress: string, challengeId: string) {
      const uuid = randomUUID()
      await pg.query(
        SQL`INSERT INTO user_challenges (id, user_address, challenge_id, challenge_uncompleted, completed_at) VALUES (${uuid}, ${userAddress.toLocaleLowerCase()}, ${challengeId}, FALSE, ${Date.now()})`
      )
    },
    async setChallengesAsExpired(userAddress: string, challengeIds: string[]) {
      await pg.query(
        SQL`
          UPDATE user_challenges SET challenge_uncompleted = true, completed_at = null
          WHERE user_address = ${userAddress.toLocaleLowerCase()} AND challenge_id = ANY(${challengeIds}::uuid[])
        `
      )
    },
    async createMission(description: string, campaign_key: string) {
      const uuid = randomUUID()

      const results = await pg.query<Mission>(
        SQL`INSERT INTO missions (id, description, campaign_key) 
          VALUES (${uuid}, ${description}, ${campaign_key}) 
         RETURNING *`
      )

      return results.rows[0]
    },
    async updateMission(id: string, description: string, campaign_key: string) {
      await pg.query<Mission>(
        SQL`
          UPDATE missions SET description = ${description}, campaign_key = ${campaign_key} 
          WHERE id = ${id}
        `
      )
    },
    async setMissionAsStart(userAddress: string, missionId: string) {
      const uuid = randomUUID()
      await pg.query(
        SQL`
          INSERT INTO user_missions (id, user_address, mission_id, start_time) 
          VALUES (${uuid}, ${userAddress.toLocaleLowerCase()}, ${missionId}, ${Date.now()})
        `
      )
    },
    async setMissionAsEnd(userMissionId: string) {
      return await pg.query(SQL`UPDATE user_missions SET end_time = ${Date.now()} WHERE id = ${userMissionId}`)
    },
    async setIncompleteMission(userMissionId: string) {
      await pg.query(SQL`UPDATE user_missions SET active = false WHERE id = ${userMissionId}`)
    },
    async getUserMissions(
      userAddress: string,
      options?: {
        active?: boolean
        missionId?: string
      }
    ) {
      const query = SQL`SELECT * FROM user_missions um WHERE um.user_address = ${userAddress.toLocaleLowerCase()}`
      if (options?.missionId) {
        query.append(SQL` AND um.mission_id = ${options.missionId}`)
      }
      if (options?.active) {
        query.append(SQL` AND um.active IS TRUE and um.end_time IS NULL`)
      }

      const result = await pg.query<UserMission>(query)
      return result.rows
    },
    async getAllUserMissionsActiveStartedOn(date) {
      const query = SQL`SELECT * FROM user_missions um WHERE um.active IS TRUE and um.end_time IS NULL and um.start_time < ${date}`

      const result = await pg.query<UserMission>(query)
      return result.rows
    },
    async getUserCompletedChallengeByGame(gameId: string, userAddress: string) {
      const result = await pg.query<{
        id: string
        description: string
        game_id: string
      }>(
        SQL`SELECT c.game_id, c.id , c.description, c.target_level
        FROM challenges c
        JOIN user_challenges uc on c.id = uc.challenge_id
        WHERE c.game_id = ${gameId} 
          and uc.user_address = ${userAddress.toLocaleLowerCase()} 
          and uc.challenge_uncompleted IS FALSE
        `
      )
      return result.rows
    },
    async getUserChallengeCompleted(userAddress: string, challengeIds: string[]) {
      const query = SQL`SELECT uc.id, uc.user_address, uc.challenge_id, uc.challenge_uncompleted
      FROM user_challenges uc
      WHERE uc.user_address = ${userAddress.toLocaleLowerCase()} 
        AND uc.challenge_id = ANY(${challengeIds}::uuid[])
        and uc.challenge_uncompleted IS FALSE
      `
      const result = await pg.query<UserChallenge>(query)
      return result.rows
    },
    async getAllGamesBeingPlayedByUser(userAddress: string) {
      const results = await pg.query<GamePlayedByUser>(
        SQL`SELECT g.id, g.name, g.parcel, p.level, p.score, p.time, p.moves, p.data 
          FROM progress p INNER JOIN games g ON g.id = p.game_id WHERE p.user_address = ${userAddress.toLocaleLowerCase()}`
      )

      return results.rows
    },
    async getGameLeaderboard(
      gameId: string,
      options: {
        sort: Omit<ProgressSort, 'level'>
        direction: SortDirection
        limit: number
        level: number | null
      }
    ) {
      const orderOption: Omit<ProgressSort, 'LATEST'> =
        Object.values(ProgressSort).find((sort) => sort === options.sort) || ProgressSort.SCORE

      const sortField = options.direction === SortDirection.ASC ? `min_${orderOption}` : `max_${orderOption}`
      const sortAlias =
        options.direction === SortDirection.ASC
          ? `MIN(${orderOption}) AS ${sortField}`
          : `MAX(${orderOption}) AS ${sortField}`

      const query = SQL`
        SELECT 
          p.game_id,
          p.user_address,
          p.user_name,
          p.level,
          p.score,
          p.time,
          p.moves,
          p.data,
          p.updated_at
        FROM 
          progress p
          `
      if (!options.level) {
        query.append(SQL`INNER JOIN (
            SELECT 
              user_address,
              MAX(level) AS max_level
            FROM 
              progress
            WHERE 
              game_id = ${gameId}
            GROUP BY 
              user_address
          ) max_levels 
          ON p.user_address = max_levels.user_address 
          AND p.level = max_levels.max_level
        `)
      }

      query.append(`INNER JOIN (
          SELECT 
            user_address,
            level,
            ${sortAlias}
          FROM 
            progress`)

      query.append(
        SQL`
          WHERE 
            game_id = ${gameId}
          `
      )
      query.append(`GROUP BY 
            user_address,
            level
        ) sort_${orderOption}
        ON p.user_address = sort_${orderOption}.user_address
        AND p.level = sort_${orderOption}.level
        AND p.${orderOption} = sort_${orderOption}.${sortField}
        `)

      query.append(
        SQL`
        WHERE 
          p.game_id = ${gameId}
      `
      )

      if (options.level) {
        query.append(SQL`AND p.level = ${options.level} `)
      }

      query.append(`ORDER BY p.level DESC, ${orderOption} ${options.direction} LIMIT ${options.limit}`)
      const results = await pg.query<GamePlayedByUser>(query)

      return results.rows
    },
    async getChallenge(challengeId: string) {
      const results = await pg.query<Challenge>(SQL`SELECT * FROM challenges WHERE id = ${challengeId}`)

      return results.rows[0]
    },
    async getChallengesByMission(missionId: string) {
      const results = await pg.query<Challenge>(SQL`SELECT * FROM challenges WHERE mission_id = ${missionId}`)

      return results.rows
    },
    async getUserChallengesByMissions(missionsId: string[], userAddress: string) {
      const results = await pg.query<ChallengeWithCompletionTime>(
        SQL`SELECT c.*, COALESCE(NOT BOOL_AND(uc.challenge_uncompleted), FALSE) AS completed, MAX(uc.completed_at) AS completed_at
            FROM challenges c
            LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_address = ${userAddress.toLocaleLowerCase()}
            WHERE mission_id = ANY(${missionsId}::uuid[])
            GROUP BY c.id`
      )

      return results.rows
    },
    async getMissionWithCampaignKeyExposure(missionId: string) {
      const results = await pg.query<Mission>(SQL`SELECT * FROM missions WHERE id = ${missionId}`)

      return results.rows[0]
    },
    async deleteMissions(missionIds: string[]) {
      await pg.query(SQL`DELETE FROM user_missions um WHERE um.mission_id = ANY(${missionIds}::uuid[])`)
      await pg.query(SQL`DELETE FROM missions m WHERE m.id = ANY(${missionIds}::uuid[])`)
    },
    async deleteChallenges(challengeIds: string[]) {
      await pg.query(SQL`DELETE FROM user_challenges uc WHERE uc.challenge_id = ANY(${challengeIds}::uuid[])`)
      await pg.query(SQL`DELETE FROM challenges c WHERE c.id = ANY(${challengeIds}::uuid[])`)
    },
    async deleteGames(gameIds: string[]) {
      await pg.query(SQL`DELETE FROM progress p WHERE p.game_id = ANY(${gameIds}::uuid[])`)
      await pg.query(SQL`DELETE FROM games g WHERE g.id = ANY(${gameIds}::uuid[])`)
    }
  }
}
