import { randomUUID } from 'crypto'
import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { admin, getIdentity, makeRequest } from '../../utils'
import { MissionType } from '../../../src/types'

test('POST /api/missions/:id/start', ({ components }) => {
  let mission
  let mission2
  let mission3

  const oldDateNow = Date.now

  beforeAll(async () => {
    const { db } = components
    const { id: gameId } = await db.createGame('TEST', '10,10')
    mission = await db.createMission('Mission Test mini-games', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES, 'thumb_url')
    mission2 = await db.createMission('Mission Test 2 mini-games', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES, 'thumb_url')
    mission3 = await db.createMission('Mission Test 3 fashion week', VALID_CAMPAIGN_KEY, MissionType.FASHION_WEEK, 'thumb_url')

  })

  afterAll(async () => {
    const { db } = components

    Date.now = oldDateNow
    await db.deleteMissions([mission.id, mission2.id, mission3.id])

  })

  it('should return 204 created', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission.id}/start`, {
      method: 'POST'
    })

    expect(response.status).toBe(204)
  })
  
  it('should return 204 when the missions has another type', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission3.id}/start`, {
      method: 'POST'
    })

    expect(response.status).toBe(204)
  })

  it('should return 400 when there is a ongoing mission of the same type', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission2.id}/start`, {
      method: 'POST'
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when the date is less than one day since last completed mission start', async () => {
    const { db } = components

    const { localFetch } = components

    const userId = admin.authChain[0].payload
    const lastMissionTest2 = await db.getLastMissionForUser(userId, MissionType.MINI_GAMES)

    const userMission = await db.getUserMissions(userId, { missionId: lastMissionTest2.id, active: true })

    await db.setMissionAsEnd(userMission[0].id)

    const response = await makeRequest(localFetch, `/api/missions/${mission2.id}/start`, {
      method: 'POST'
    })

    expect(response.status).toBe(400)
  })
  

  it('should return 204 when the date is more than than one day since last completed mission start', async () => {
    const { db } = components

    const { localFetch } = components

    const now = Date.now()
    Date.now = () => now + 86400000 // 1 day
    const response = await makeRequest(localFetch, `/api/missions/${mission2.id}/start`, {
      method: 'POST'
    })

    expect(response.status).toBe(204)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/missions/${mission.id}/start`, {
      method: 'POST'
    })

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.message).toBe('Invalid Auth Chain')
  })

  it('should return 400 when Invalid ID', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/not-a-uuid/start`, {
      method: 'POST'
    })

    const json = await response.json()

    expect(response.status).toBe(400)

    expect(json.message).toBe(`Invalid UUID`)
  })

  it('should return 400 when there is no missions for the UUID sent', async () => {
    const { localFetch } = components

    const uuid = randomUUID()
    const response = await makeRequest(localFetch, `/api/missions/${uuid}/start`, {
      method: 'POST'
    })

    const json = await response.json()

    expect(response.status).toBe(400)

    expect(json.message).toBe(`No mission found with this UUID`)
  })

})
