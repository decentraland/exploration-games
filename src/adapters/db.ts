import SQL from 'sql-template-strings'
import { randomUUID } from 'crypto'
import {
  AppComponents,
  Challenge,
  Game,
  GameMetrics,
  GamePlayedByUser,
  ProgressSort,
  SortDirection,
  UserProgress
} from '../types'

export interface IDatabaseComponent {
  createGame(name: string, parcel: string): Promise<Game>
  getGame(gameId: string): Promise<Game>
  getAllGames(): Promise<Game[]>
  getActiveGames(): Promise<Game[]>
  deactivateGame(gameId: string): Promise<void>
  getUserProgressInGame(
    gameId: string,
    userAddress: string,
    option: { sort: ProgressSort; direction: SortDirection; limit: number }
  ): Promise<UserProgress[]>
  createProgressInGame(
    gameId: string,
    userAddress: string,
    gameMetrics: GameMetrics,
    data?: Record<string, any> | null
  ): Promise<UserProgress>
  getAllGamesBeingPlayedByUser(userAddress: string): Promise<GamePlayedByUser[]>
  getGameLeaderboard(gameId: string): Promise<GamePlayedByUser[]>
  createGameChallenge(gameId: string, description: string, targetLevel: number, campaignKey: string): Promise<Challenge>
  getActiveChallengesForGame(gameId: string): Promise<Challenge[]>
  deactivateGameChallenge(challengeId: string): Promise<void>
  setChallengeAsComplete(userAddress: string, challengeId: string): Promise<void>
  getChallenge(challengeId: string): Promise<Challenge>
  getUserCompletedChallengeByGame(
    gameId: string,
    userAddress: string
  ): Promise<Pick<Challenge, 'game_id' | 'id' | 'description'>[]>
}

export function createDBComponent(components: Pick<AppComponents, 'pg'>): IDatabaseComponent {
  const { pg } = components

  return {
    async createGame(name, parcel) {
      const uuid = randomUUID()
      const results = await pg.query<Game>(
        SQL`INSERT INTO games (id, name, parcel) VALUES (${uuid}, ${name}, ${parcel}) RETURNING *`
      )

      return results.rows[0]
    },
    async getGame(gameId) {
      const results = await pg.query<Game>(SQL`SELECT * FROM games WHERE id = ${gameId}`)

      return results.rows[0]
    },
    async getActiveGames() {
      const results = await pg.query<Game>(SQL`SELECT * FROM games WHERE active IS TRUE`)

      return results.rows
    },
    async getAllGames() {
      const results = await pg.query<Game>(SQL`SELECT * FROM games`)

      return results.rows
    },
    async deactivateGame(gameId) {
      await pg.query(SQL`UPDATE games SET active = false WHERE id = ${gameId}`)
    },
    async getUserProgressInGame(gameId, userAddress, option) {
      const query = SQL`
        SELECT * 
        FROM progress 
        WHERE game_id = ${gameId} 
          AND user_address = ${userAddress} 
      `

      const orderOption: ProgressSort =
        Object.values(ProgressSort).find((sort) => sort === option.sort) || ProgressSort.LASTEST

      const direction = option.direction === SortDirection.ASC ? SortDirection.ASC : SortDirection.DESC

      query.append(`ORDER BY ${orderOption} ${direction} `)

      query.append(SQL`LIMIT ${option.limit}`)

      const results = await pg.query<UserProgress>(query)
      return results.rows
    },
    async createProgressInGame(gameId, userAddress, gameMetrics, data) {
      const uuid = randomUUID()
      const results = await pg.query<UserProgress>(
        SQL`INSERT INTO progress (id, game_id, user_address, level, score, time, moves, data) 
            VALUES (${uuid}, ${gameId}, ${userAddress}, ${gameMetrics.level}, ${gameMetrics.score}, ${gameMetrics.time}, ${gameMetrics.moves}, ${data})
            RETURNING *
          `
      )

      return results.rows[0]
    },
    async createGameChallenge(gameId, description, targetLevel, campaignKey) {
      const uuid = randomUUID()
      const results = await pg.query<Challenge>(
        SQL`INSERT INTO challenges (id, game_id, description, target_level, campaign_key) VALUES (${uuid}, ${gameId}, ${description}, ${targetLevel}, ${campaignKey}) RETURNING *`
      )

      return results.rows[0]
    },
    async getActiveChallengesForGame(gameId) {
      const results = await pg.query<Challenge>(
        SQL`SELECT * FROM challenges WHERE active IS TRUE AND game_id = ${gameId}`
      )
      return results.rows
    },
    async deactivateGameChallenge(challengeId) {
      await pg.query(SQL`UPDATE challenges SET active = false WHERE id = ${challengeId}`)
    },
    async setChallengeAsComplete(userAddress, challengeId) {
      await pg.query(
        SQL`INSERT INTO user_challenges (user_address, challenge_id) VALUES (${userAddress}, ${challengeId})`
      )
    },
    async getUserCompletedChallengeByGame(gameId, userAddress) {
      const result = await pg.query<{
        id: string
        description: string
        game_id: string
      }>(
        SQL`SELECT c.game_id, c.id , c.description, c.target_level
        FROM challenges c
        JOIN user_challenges uc on c.id = uc.challenge_id
        WHERE c.game_id = ${gameId} 
          and uc.user_address = ${userAddress} 
        `
      )
      return result.rows
    },
    async getAllGamesBeingPlayedByUser(userAddress) {
      const results = await pg.query<GamePlayedByUser>(
        SQL`SELECT g.id, g.name, g.parcel, p.level, p.score, p.time, p.moves, p.data 
          FROM progress p INNER JOIN games g ON g.id = p.game_id WHERE p.user_address = ${userAddress}`
      )

      return results.rows
    },
    async getGameLeaderboard(gameId) {
      const results = await pg.query<GamePlayedByUser>(
        SQL`SELECT g.id, g.name, g.parcel, p.user_address, p.level, p.score, p.time, p.moves, p.data 
          FROM progress p INNER JOIN games g ON g.id = p.game_id WHERE g.id = ${gameId}`
      )

      return results.rows
    },
    async getChallenge(challengeId: string) {
      const results = await pg.query<Challenge>(SQL`SELECT * FROM challenges WHERE id = ${challengeId}`)

      return results.rows[0]
    }
  }
}
