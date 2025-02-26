import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { makeRequest } from '../../utils'

test('GET /api/missions', ({ components }) => {
  beforeAll(async () => {
    const { db } = components
    await db.createMission('Mission Test1', VALID_CAMPAIGN_KEY, 'TEST')
    await db.createMission('Mission Test2', VALID_CAMPAIGN_KEY, 'TEST')
    const mission3 = await db.createMission('Mission Test3', VALID_CAMPAIGN_KEY, 'TEST')
    const mission4 = await db.createMission('Mission Test4', VALID_CAMPAIGN_KEY, 'TEST')
    await db.deactivateMission(mission3.id)
    await db.deactivateMission(mission4.id)
  })

  it('should return 200 with active missions', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions?type=TEST`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data.every(({ active }) => active)).toBe(true)
  })

  it('should return 200 with all missions', async () => {
    const { localFetch, db } = components

    const missions = await db.getActiveMissions()

    await db.deactivateGame(missions[0].id)

    const response = await makeRequest(localFetch, `/api/missions?all`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data.some(({ active }) => !active)).toBe(true)
  })
})
