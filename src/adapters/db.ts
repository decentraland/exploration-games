import SQL from 'sql-template-strings'
import { randomUUID } from 'crypto'
import { AppComponents, Challenge, Game, GamePlayedByUser, UserProgress } from '../types'

export interface IDatabaseComponent {
  createGame(name: string, parcel: string): Promise<Game>
  getGame(gameId: string): Promise<Game>
  getAllGames(): Promise<Game[]>
  getActiveGames(): Promise<Game[]>
  deactivateGame(gameId: string): Promise<void>
  getUserProgressInGame(gameId: string, userAddress: string): Promise<UserProgress>
  upsertProgressInGame(
    gameId: string,
    userAddress: string,
    score: number,
    data?: Record<string, any> | null
  ): Promise<UserProgress>
  getAllGamesBeingPlayedByUser(userAddress: string): Promise<GamePlayedByUser[]>
  createGameChallenge(gameId: string, description: string): Promise<Challenge>
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
    async getUserProgressInGame(gameId, userAddress) {
      const results = await pg.query<UserProgress>(
        SQL`SELECT * FROM progress WHERE game_id = ${gameId} AND user_address = ${userAddress}`
      )

      return results.rows[0]
    },
    async upsertProgressInGame(gameId, userAddress, score, data) {
      const results = await pg.query<UserProgress>(
        SQL`INSERT INTO progress (game_id, user_address, score, data) 
            VALUES (${gameId}, ${userAddress}, ${score}, ${data})
            ON CONFLICT (user_address,game_id)
            DO UPDATE SET score = ${score}, data = ${data || null}, updated_at = now()
            RETURNING *
          `
      )

      return results.rows[0]
    },
    async createGameChallenge(gameId, description) {
      const uuid = randomUUID()
      const results = await pg.query<Challenge>(
        SQL`INSERT INTO challenges (id, game_id, description) VALUES (${uuid}, ${gameId}, ${description}) RETURNING *`
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
        SQL`SELECT c.game_id, c.id , c.description 
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
        SQL`SELECT g.id, g.name, g.parcel, p.score, p.data 
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
