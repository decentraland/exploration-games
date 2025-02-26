import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { makeRequest } from '../../utils'

test('GET /api/missions/available', ({ components }) => {
  let mission3
  const missionsIds = []
  let challenge1
  let game
  beforeAll(async () => {
    const { db } = components
    const mission1 = await db.createMission('TEST Mission User 1', VALID_CAMPAIGN_KEY, 'TEST')
    missionsIds.push(mission1.id)
    missionsIds.push((await db.createMission('TEST Mission User 2', VALID_CAMPAIGN_KEY, 'TEST')).id)
    mission3 = await db.createMission('TEST Mission User 3', VALID_CAMPAIGN_KEY, 'TEST')
    missionsIds.push(mission3.id)
    await db.deactivateMission(mission3.id)
    game = await db.createGame('TEST Mission User', '10,10')

    challenge1 = await db.createGameChallenge({
      gameId: game.id,
      description: 'TEST Mission User 4',
      targetLevel: 4,
      missionId: mission1.id
    })
    await db.setMissionAsStart('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', mission1.id)
    await db.setChallengeAsComplete('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', challenge1.id)
    const userMission = await db.getUserMissions('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      missionId: mission1.id,
      active: true
    })
    await db.setMissionAsEnd(userMission[0].id)
  })

  afterAll(async () => {
    const { db } = components
    await db.deleteChallenges([challenge1.id])
    await db.deleteGames([game.id])
    await db.deleteMissions(missionsIds)
  })

  it('should return 200 with the missions available for the user', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/available?type=TEST`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data.every(({ id }) => id === mission3.id)).toBe(false)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/missions/available?type=TEST`)

    expect(response.status).toBe(400)
  })
})
