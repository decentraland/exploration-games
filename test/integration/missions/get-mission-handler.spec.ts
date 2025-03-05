import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { makeRequest } from '../../utils'
import { MissionType } from '../../../src/types'

test('GET /api/missions/:id', ({ components }) => {
  let mission
  let game
  let game1
  let game2

  let challenge
  let challenge1
  let challenge2

  beforeAll(async () => {
    const { db } = components
    game = await db.createGame('TEST', '10,10')
    game1 = await db.createGame('TEST 1', '10,10')
    game2 = await db.createGame('TEST 2', '10,10')
    mission = await db.createMission('Mission Test1', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES)
    challenge = await db.createGameChallenge({
      gameId: game.id,
      description: 'Reach level 6',
      targetLevel: 6,
      missionId: mission.id
    })
    challenge1 = await db.createGameChallenge({
      gameId: game1.id,
      description: 'Reach level 6',
      targetLevel: 6,
      missionId: mission.id
    })
    challenge2 = await db.createGameChallenge({
      gameId: game2.id,
      description: 'Reach level 6',
      targetLevel: 6,
      missionId: mission.id
    })
  })

  afterAll(async () => {
    const { db } = components
    await db.deleteChallenges([challenge.id, challenge1.id, challenge2.id])
    await db.deleteMissions([mission.id])
    await db.deleteGames([game.id, game1.id, game2.id])
  })

  it('should return 200 with a mission, games and challenges associated', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission.id}?type=${MissionType.MINI_GAMES}`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.mission.id).toBe(mission.id)
    expect(json.data.mission.description).toBe(mission.description)
    expect(json.data.challenges.length).toBe(3)
    expect(json.data.games.length).toBe(3)
  })
})
