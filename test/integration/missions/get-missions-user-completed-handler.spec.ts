import { Mission } from '../../../src/types'
import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { makeRequest } from '../../utils'

test('GET /api/missions/completed', ({ components }) => {
  let mission1: Mission, mission2: Mission, mission3: Mission
  beforeAll(async () => {
    const { db } = components

    mission1 = await db.createMission('TEST Mission User 1', VALID_CAMPAIGN_KEY)
    mission2 = await db.createMission('TEST Mission User 2', VALID_CAMPAIGN_KEY)
    mission3 = await db.createMission('TEST Mission User 3', VALID_CAMPAIGN_KEY)

    await db.deactivateMission(mission3.id)

    const { id: gameId } = await db.createGame('TEST Mission User', '10,10')
    const { id: gameId2 } = await db.createGame('TEST Mission User1', '10,10')

    const challenge1 = await db.createGameChallenge({
      gameId,
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

    await db.createGameChallenge({
      gameId: gameId2,
      description: 'TEST Mission User 5',
      targetLevel: 5,
      missionId: mission2.id
    })

    await db.setMissionAsStart('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', mission2.id)
  })

  it('should return 200 with missions completed for the user', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/completed`)

    expect(response.status).toBe(200)

    const json = await response.json()
    console.log(json.data.missions)
    expect(json.data.missions.length).toBeGreaterThan(0)
    expect(json.data.missions[0].id).toBe(mission1.id)
    expect(json.data.missions.every(({ id }) => id === mission3.id)).toBe(false)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/missions/completed`)

    expect(response.status).toBe(400)
  })
})
