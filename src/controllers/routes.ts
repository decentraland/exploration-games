import { Router } from '@well-known-components/http-server'
import { errorHandler } from '@dcl/platform-server-commons/dist/controllers/handlers/error-handler'
import { wellKnownComponents as authVerificationMiddleware } from '@dcl/platform-crypto-middleware'
import { GlobalContext } from '../types'
import isAdminMiddleware from './middlewares/is-admin-middleware'
import isValidKeyMiddleware from './middlewares/is-valid-key-middleware'
import { statusHandler } from './handlers/status-handler'
import { createGameHandler } from './handlers/games/create-game-handler'
import { getGamesHandler } from './handlers/games/get-games-handler'
import { deactivateGameHandler } from './handlers/games/deactivate-game-handler'
import { createChallengeHandler } from './handlers/challenges/create-challenge-handler'
import { newProgressInGameHandler } from './handlers/games/new-progress-in-game-handler'
import { getChallengesForGameHandler } from './handlers/games/get-challenges-for-game-handler'
import { getProgressInGameHandler } from './handlers/games/get-progress-in-game-handler'
import { getAllUserProgressInGamesHandler } from './handlers/games/get-all-user-progress-in-games-handler'
import { getUserCompletedChallengesByGame } from './handlers/games/get-user-completed-challenges-by-game-handler'
import { getProgressLeaderboardInGamesHandler } from './handlers/games/get-progress-leaderboard-in-games-handler'
import { getMissionsHandler } from './handlers/missions/get-missions-handler'
import { createMissionHandler } from './handlers/missions/create-mission-handler'
import { getMissionHandler } from './handlers/missions/get-mission-handler'
import { createUserMissionHandler } from './handlers/missions/create-user-mission-handler'
import { getMissionsAvailableHandler } from './handlers/missions/get-missions-user-handler'
import { getMissionsInProgressHandler } from './handlers/missions/get-missions-user-in-progress-handler'
import { getMissionsCompletedHandler } from './handlers/missions/get-missions-user-completed-handler'
import { updateMissionHandler } from './handlers/missions/update-mission-handler'
import { updateGameHandler } from './handlers/games/update-game-handler'
import { updateChallengeHandler } from './handlers/challenges/update-challenge-handler'
import { setProgressStatusHandler } from './handlers/games/set-progress-status-handler'
import { getAllProgressInGameHandler } from './handlers/games/get-all-progress-in-game-handler'
import { newMultiplayerProgressHandler } from './handlers/games/new-multiplayer-progress-handler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(globalContext: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()

  const { components } = globalContext

  const auth = authVerificationMiddleware({
    fetcher: components.fetcher,
    optional: false,
    metadataValidator: (metadata) => metadata.signer === 'decentraland-kernel-scene'
  })

  components.server.use(router.middleware())
  // register not implemented/method not allowed/cors response middleware
  components.server.use(router.allowedMethods())

  router.use(errorHandler)
  router.get('/status', statusHandler)

  router.prefix('/api')

  router.get('/games', getGamesHandler)
  router.get('/games/:id/challenges', getChallengesForGameHandler)
  router.get('/games/:id/leaderboard', getProgressLeaderboardInGamesHandler)
  router.get('/missions/available', auth, getMissionsAvailableHandler)
  router.get('/missions/in_progress', auth, getMissionsInProgressHandler)
  router.get('/missions/completed', auth, getMissionsCompletedHandler)

  router.get('/games/:id/progress', auth, getProgressInGameHandler)
  router.post('/games/:id/progress', auth, newProgressInGameHandler)
  router.get('/games/progress', auth, getAllUserProgressInGamesHandler)
  router.get('/games/:id/challenges/completed', auth, getUserCompletedChallengesByGame)
  router.post('/missions/:id/start', auth, createUserMissionHandler)

  router.post('/multiplayer/progress', isValidKeyMiddleware, newMultiplayerProgressHandler)

  router.get('/missions', auth, isAdminMiddleware, getMissionsHandler)
  router.get('/missions/:id', auth, isAdminMiddleware, getMissionHandler)
  router.post('/games', auth, isAdminMiddleware, createGameHandler)
  router.patch('/games/:id/deactivate', auth, isAdminMiddleware, deactivateGameHandler)
  router.patch('/games/:id', auth, isAdminMiddleware, updateGameHandler)
  router.post('/challenges', auth, isAdminMiddleware, createChallengeHandler)
  router.patch('/challenges/:id', auth, isAdminMiddleware, updateChallengeHandler)
  router.post('/missions', auth, isAdminMiddleware, createMissionHandler)
  router.patch('/missions/:id', auth, isAdminMiddleware, updateMissionHandler)
  router.patch('/games/progress/status', auth, isAdminMiddleware, setProgressStatusHandler)
  router.get('/games/:id/progress/all', auth, isAdminMiddleware, getAllProgressInGameHandler)
  return router
}
