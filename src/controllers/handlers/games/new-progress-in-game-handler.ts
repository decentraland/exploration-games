import Joi from 'joi'
import { InvalidRequestError } from '@dcl/platform-server-commons/dist/errors'
import { parseJson } from '@dcl/platform-server-commons/dist/utils'
import { HandlerContextWithPath, NewProgressInGamePayload } from '../../../types'
import { uuidSchema } from '../../../utils'
import { validateSignedFetch } from '../../middlewares/validate-signed-fetch'
import { isScoreMetCondition } from '../../utils/challenge-condition'
import { getMissionsByStatus, MissionStatus } from '../../utils/get-missions-by-status'
import { checkCompleteMission } from '../../utils/check-mission-complete'

const schema = Joi.object<NewProgressInGamePayload>().keys({
  user_name: Joi.string().required(),
  level: Joi.number().required().min(1),
  score: Joi.number().optional(),
  time: Joi.number().optional(),
  moves: Joi.number().optional(),
  data: Joi.object().optional()
})

export async function newProgressInGameHandler(
  ctx: HandlerContextWithPath<'db' | 'rewardService' | 'logs', '/games/:id/progress'>
) {
  const {
    components: { logs, db },
    request,
    params,
    verification
  } = ctx

  const logger = logs.getLogger('new-progress-in-game-handler')
  const { id } = params
  const body = await parseJson<NewProgressInGamePayload>(request)

  const validateGameId = uuidSchema.validate(id)
  if (validateGameId.error) {
    throw new InvalidRequestError('Invalid UUID')
  }

  const validatePayload = schema.validate(body)
  if (validatePayload.error) {
    logger.warn(
      `Invalid new progress in game object received: ${validatePayload.error.message} (${JSON.stringify(body)}`
    )
    throw new InvalidRequestError(validatePayload.error.message)
  }

  // Validate signed fetch
  await validateSignedFetch(ctx, { body, gameId: validateGameId.value, validateParcel: true })

  const progress = await db.createProgressInGame(
    id,
    {
      userAddress: verification!.auth,
      userName: body.user_name
    },
    { level: body.level, score: body.score, time: body.time, moves: body.moves },
    body.data
  )

  const { challenges } = await getMissionsByStatus(MissionStatus.IN_PROGRESS, '', verification!.auth, db)

  const gameChallenges = challenges.filter((challenge) => challenge.game_id === id && !challenge.completed)

  for (const challenge of gameChallenges) {
    const conditionMet = isScoreMetCondition(body, challenge.data, logger)

    if (conditionMet) {
      console.log('marking challenge as completed: ', challenge.id)
      await db.setChallengeAsComplete(verification!.auth, challenge.id)

      return await checkCompleteMission(ctx.components, challenge.mission_id, verification!.auth)
    }
  }

  return {
    status: 201,
    body: {
      data: progress
    }
  }
}
