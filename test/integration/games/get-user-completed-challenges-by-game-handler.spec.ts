import { MissionType } from '../../../src/types'
import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { makeRequest } from '../../utils'

test('GET /api/games/:id/challenges/completed', ({ components }) => {
  let game
  let mission
  let challenge
  afterAll(async () => {
    const { db } = components
    await db.deleteChallenges([challenge.id])
    await db.deleteMissions([mission.id])
    await db.deleteGames([game.id])
  })

  it('should return 200 with completed challenges', async () => {
    const { localFetch, db } = components

    game = await db.createGame('TEST', '10,10')
    mission = await db.createMission('Mission Test', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES)
    challenge = await db.createGameChallenge({
      gameId: game.id,
      description: 'Reach Level 4',
      targetLevel: 4,
      missionId: mission.id
    })
    await db.setChallengeAsComplete('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', challenge.id)

    const response = await makeRequest(localFetch, `/api/games/${game.id}/challenges/completed`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data[0].game_id).toBe(game.id)
    expect(body.data[0].id).toBe(challenge.id)
    expect(body.data[0].description).toBe('Reach Level 4')
    expect(body.data[0].target_level).toBe(4)
  })

  it('should return 400', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/aaaaaa/challenges/completed`)

    expect(response.status).toBe(400)
  })
})
