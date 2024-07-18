import { Router } from '@well-known-components/http-server'
import { errorHandler } from '@dcl/platform-server-commons/dist/controllers/handlers/error-handler'
import { wellKnownComponents as authVerificationMiddleware } from '@dcl/platform-crypto-middleware'
import { GlobalContext } from '../types'
import isAdminMiddleware from './middlewares/is-admin-middleware'
import { statusHandler } from './handlers/status-handler'
import { createGameHandler } from './handlers/games/create-game-handler'
import { getGamesHandler } from './handlers/games/get-games-handler'
import { deactivateGameHandler } from './handlers/games/deactivate-game-handler'
import { createChallengeHandler } from './handlers/challenges/create-challenge-handler'
import { newProgressInGameHandler } from './handlers/games/new-progress-in-game-handler'
import { getChallengesForGameHandler } from './handlers/games/get-challenges-for-game-handler'
import { getProgressInGameHandler } from './handlers/games/get-progress-in-game-handler'
import { getAllUserProgressInGamesHandler } from './handlers/games/get-all-user-progress-in-games-handler'
import { userCompletedChallengeHandler } from './handlers/challenges/user-completed-challenge-handler'
import { getUserCompletedChallengesByGame } from './handlers/games/get-user-completed-challenges-by-game-handler'
import { getProgressLeaderboardInGamesHandler } from './handlers/games/get-progress-leaderboard-in-games-handler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(globalContext: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()

  const { components } = globalContext

  const auth = authVerificationMiddleware({
    fetcher: components.fetcher,
    optional: false
  })

  components.server.use(router.middleware())
  // register not implemented/method not allowed/cors response middleware
  components.server.use(router.allowedMethods())

  router.use(errorHandler)
  router.get('/status', statusHandler)

  router.prefix('/api')

  router.get('/games', getGamesHandler) // get created games (backoffice or PX)
  router.get('/games/:id/challenges', getChallengesForGameHandler) // get challenges for a specific game (backoffice or PX)
  router.get('/games/:id/leaderboard', getProgressLeaderboardInGamesHandler)

  router.get('/games/:id/progress', auth, getProgressInGameHandler) // get auth user progress for specific game
  router.post('/games/:id/progress', auth, newProgressInGameHandler) // upsert auth user progress for specific game
  router.get('/games/progress', auth, getAllUserProgressInGamesHandler) // get all games being played by auth user
  router.get('/games/:id/challenges/completed', auth, getUserCompletedChallengesByGame) // get completed challenges for a specific game and user
  router.post('/challenges/:id', auth, userCompletedChallengeHandler) // mark a challenge as completed for auth user

  router.post('/games', auth, isAdminMiddleware, createGameHandler) // create a new game (backoffice)
  router.patch('/games/:id/deactivate', auth, isAdminMiddleware, deactivateGameHandler) // deactivate a game (backoffice)
  router.post('/games/:id/challenges', auth, isAdminMiddleware, createChallengeHandler) // create a new challenge for a game (backoffice)

  return router
}
