import SQL from 'sql-template-strings'
import { randomUUID } from 'crypto'
import { AppComponents, Challenge, Game, UserProgress } from '../types'

const GAMES_TABLE = 'games'
const PROGRESS_TABLE = 'progress'
const CHALLENGES = 'challenges'
const USER_CHALLENGES = 'user_challenges'

export interface IDatabaseComponent {
  createGame(name: string, parcel: string, maxLevels: number): Promise<void>
  getActiveGames(): Promise<Game[]>
  deactivateGame(gameId: string): Promise<void>
  getUserProgressInGame(gameId: string, userAddress: string): Promise<UserProgress>
  upsertProgressInGame(
    gameId: string,
    userAddress: string,
    level: number,
    score: number,
    data: Record<string, any>
  ): Promise<void>
  createGameChallenge(gameId: string, description: string, targetLevel: number): Promise<void>
  getActiveChallengesForGame(gameId: string): Promise<Challenge[]>
  deactivateGameChallenge(challengeId: string): Promise<void>
  userCompletedChallenge(userAddress: string, challengeId: string): Promise<void>
}

export function createDBComponent(components: Pick<AppComponents, 'pg'>): IDatabaseComponent {
  const { pg } = components

  return {
    async createGame(name, parcel, maxLevels) {
      const uuid = randomUUID()
      await pg.query(
        SQL`INSERT INTO ${GAMES_TABLE} (id, name, parcel, max_levels) VALUES (${uuid}, ${name}, ${parcel}, ${maxLevels})`
      )
    },
    async getActiveGames() {
      const results = await pg.query<Game>(SQL`SELECT * FROM ${GAMES_TABLE} WHERE active IS TRUE`)

      return results.rows
    },
    async deactivateGame(gameId) {
      await pg.query(SQL`UPDATE ${GAMES_TABLE} SET active = false WHERE id = ${gameId}`)
    },
    async getUserProgressInGame(gameId, userAddress) {
      const results = await pg.query<UserProgress>(
        SQL`SELECT * FROM ${PROGRESS_TABLE} WHERE game_id = ${gameId} AND user_address = ${userAddress}`
      )

      return results.rows[0]
    },
    async upsertProgressInGame(gameId, userAddress, level, score, data) {
      await pg.query(
        SQL`INSERT INTO ${PROGRESS_TABLE} (game_id, user_address, level, score, data) 
            VALUES (${gameId}, ${userAddress}, ${level}, ${score}, ${data})
            ON CONFLICT ON CONSTRAINT user_progress_idx
            DO UPDATE SET level = ${level}, score = ${score}, data = ${data}, updated_at = now()
          `
      )
    },
    async createGameChallenge(gameId, description, targetLevel) {
      const uuid = randomUUID()
      await pg.query(
        SQL`INSERT INTO ${CHALLENGES} (id, game_id, description, target_level) VALUES (${uuid}, ${gameId}, ${description}, ${targetLevel})`
      )
    },
    async getActiveChallengesForGame(gameId) {
      const results = await pg.query<Challenge>(
        SQL`SELECT * FROM ${CHALLENGES} WHERE active IS TRUE AND game_id = ${gameId}`
      )
      return results.rows
    },
    async deactivateGameChallenge(challengeId) {
      await pg.query(SQL`UPDATE ${CHALLENGES} SET active = false WHERE id = ${challengeId}`)
    },
    async userCompletedChallenge(userAddress, challengeId) {
      await pg.query(
        SQL`INSERT INTO ${USER_CHALLENGES} (user_address, challenge_id) VALUES (${userAddress}, ${challengeId})`
      )
    }
  }
}
