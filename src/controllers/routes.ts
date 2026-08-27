import { Router } from '@dcl/http-server'
import { errorHandler, bearerTokenMiddleware } from '@dcl/http-commons'
import { wellKnownComponents as authVerificationMiddleware, requireSigner } from '@dcl/crypto-middleware'
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

  // Metadata keys the authenticated routes authorize on, declared so a request signed with the
  // pre-6.0.0 payload still verifies.
  //
  // Needed because every caller here is a scene, signing through the explorer runtime, which still
  // folds the whole payload before signing. 6.x binds the metadata bytes verbatim, and `hashPayload`
  // is camelCase, so for any request carrying a body the two payloads differ and verification fails
  // outright with a 401 — `optional: false` means the caller simply loses access.
  //
  // Declaring the keys is what keeps the fallback narrow. A folded payload leaves metadata casing
  // outside the signature, so a delivered `{"Parcel":…}` would share a valid signature with
  // `{"parcel":…}` while reading as absent to the parcel check. Naming a key refuses that with a 400
  // rather than rewriting anything. Derived from the reads in this repo:
  //
  //   signer       `requireSigner` below
  //   parcel       `validateGameParcel` in validate-signed-fetch.ts
  //   hashPayload  `validateBody` in validate-signed-fetch.ts
  //
  // Not declared because nothing reads them today: `realm.hostname` and `realm.serverName` are only
  // touched by `validateUserInDCL`, whose call site is commented out. Re-enabling it means adding
  // both here, or its host check can be re-spelled past on a legacy-signed request.
  //
  // Remove once the explorer runtime signs the 6.x payload.
  const auth = authVerificationMiddleware({
    fetcher: components.fetcher,
    optional: false,
    metadataValidator: requireSigner('decentraland-kernel-scene'),
    canonicalMetadataKeys: ['signer', 'parcel', 'hashPayload']
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

  const multiplayerToken = await globalContext.components.config.getString('MULTIPLAYER_KEY')
  if (!!multiplayerToken) {
    router.post('/multiplayer/progress', bearerTokenMiddleware(multiplayerToken), newMultiplayerProgressHandler)
  }

  return router
}
