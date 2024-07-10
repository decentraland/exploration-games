import SQL from 'sql-template-strings'
import { randomUUID } from 'crypto'
import { AppComponents, Challenge, Game, GamePlayedByUser, progressOption, UserProgress } from '../types'

export interface IDatabaseComponent {
  createGame(name: string, parcel: string): Promise<Game>
  getGame(gameId: string): Promise<Game>
  getAllGames(): Promise<Game[]>
  getActiveGames(): Promise<Game[]>
  deactivateGame(gameId: string): Promise<void>
  getUserProgressInGame(gameId: string, userAddress: string, option?: progressOption): Promise<UserProgress>
  getAllUserProgressInGame(gameId: string, userAddress: string): Promise<UserProgress[]>
  upsertProgressInGame(
    gameId: string,
    userAddress: string,
    level: number,
    score: number,
    data?: Record<string, any> | null
  ): Promise<UserProgress>
  getAllGamesBeingPlayedByUser(userAddress: string): Promise<GamePlayedByUser[]>
  createGameChallenge(gameId: string, description: string, targetLevel: number): Promise<Challenge>
  getActiveChallengesForGame(gameId: string): Promise<Challenge[]>
  deactivateGameChallenge(challengeId: string): Promise<void>
  userCompletedChallenge(userAddress: string, challengeId: string): Promise<void>
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
    async getUserProgressInGame(gameId, userAddress, option = progressOption.LAST) {
      let query
      if (option === progressOption.MAX) {
        query = SQL`
          SELECT * 
          FROM progress 
          WHERE game_id = ${gameId} 
            AND user_address = ${userAddress} 
          ORDER BY level DESC 
          LIMIT 1;
        `
      } else {
        query = SQL`
          SELECT * 
          FROM progress 
          WHERE game_id = ${gameId} 
            AND user_address = ${userAddress} 
          ORDER BY updated_at DESC 
          LIMIT 1;
        `
      }

      const results = await pg.query<UserProgress>(query)
      return results.rows[0]
    },
    async getAllUserProgressInGame(gameId, userAddress) {
      const results = await pg.query<UserProgress>(
        SQL`
          SELECT * 
          FROM progress 
          WHERE game_id = ${gameId} 
            AND user_address = ${userAddress} 
          ORDER BY updated_at DESC 
        `
      )
      return results.rows
    },
    async upsertProgressInGame(gameId, userAddress, level, score, data) {
      const results = await pg.query<UserProgress>(
        SQL`INSERT INTO progress (game_id, user_address, level, score, data) 
            VALUES (${gameId}, ${userAddress}, ${level}, ${score}, ${data})
            RETURNING *
          `
      )

      return results.rows[0]
    },
    async createGameChallenge(gameId, description, targetLevel) {
      const uuid = randomUUID()
      const results = await pg.query<Challenge>(
        SQL`INSERT INTO challenges (id, game_id, description, target_level) VALUES (${uuid}, ${gameId}, ${description}, ${targetLevel}) RETURNING *`
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
    async userCompletedChallenge(userAddress, challengeId) {
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
        SQL`SELECT g.id, g.name, g.parcel, p.level, p.score, p.data 
          FROM progress p INNER JOIN games g ON g.id = p.game_id WHERE p.user_address = ${userAddress}`
      )

      return results.rows
    },
    async getChallenge(challengeId: string) {
      const results = await pg.query<Challenge>(SQL`SELECT * FROM challenges WHERE id = ${challengeId}`)

      return results.rows[0]
    }
  }
}
