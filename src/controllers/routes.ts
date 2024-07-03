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

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(globalContext: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()

  const {
    components: { fetcher }
  } = globalContext

  const auth = authVerificationMiddleware({
    fetcher,
    optional: false
  })

  router.use(errorHandler)
  router.get('/status', statusHandler)

  router.prefix('/api')

  // Games routes
  router.post('/games', auth, isAdminMiddleware, createGameHandler) // create a new game (backoffice)
  router.patch('/games/:id/deactivate', auth, isAdminMiddleware, deactivateGameHandler) // deactivate a game (backoffice)

  router.get('/games', getGamesHandler) // get created games (backoffice or PX)
  router.get('/games/:id/challenges', getChallengesForGameHandler) // get challenges for a specific game (backoffice or PX)

  router.get('/games/:id/progress', auth, getProgressInGameHandler) // get auth user progress for specific game
  router.post('/games/:id/progress', auth, newProgressInGameHandler) // upsert auth user progress for specific game
  router.get('/games/progress', auth, getAllUserProgressInGamesHandler) // get all games being played by auth user

  // Challenges routes
  router.post('/challenges', auth, isAdminMiddleware, createChallengeHandler) // create a new challenge for a game (backoffice)

  router.post('/challenges/:id', auth, userCompletedChallengeHandler) // mark a challenge as completed for auth user

  return router
}
