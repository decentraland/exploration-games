import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'

test('GET /api/missions/:id', ({ components }) => {
  let mission
  beforeAll(async () => {
    const { db } = components
    const game = await db.createGame('TEST', '10,10')
    const game1 = await db.createGame('TEST 1', '10,10')
    const game2 = await db.createGame('TEST 2', '10,10')
    mission = await db.createMission('Mission Test1', VALID_CAMPAIGN_KEY)
    await db.createGameChallenge(game.id, 'Reach level 6', 6, mission.id)
    await db.createGameChallenge(game1.id, 'Reach level 6', 6, mission.id)
    await db.createGameChallenge(game2.id, 'Reach level 6', 6, mission.id)
  })

  it('should return 200 with a mission and the games and challenges associated', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/missions/${mission.id}`)

    expect(response.status).toBe(200)

    const json = await response.json()
    console.log(mission.id)
    expect(json.data.mission.id).toBe(mission.id)
    expect(json.data.mission.description).toBe(mission.description)
    expect(json.data.challenges.length).toBe(3)
    expect(json.data.games.length).toBe(3)
  })
})
