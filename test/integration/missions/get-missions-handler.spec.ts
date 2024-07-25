import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'

test('GET /api/missions', ({ components }) => {
  beforeAll(async () => {
    const { db } = components
    await db.createMission('Mission Test1', VALID_CAMPAIGN_KEY)
    await db.createMission('Mission Test2', VALID_CAMPAIGN_KEY)
    const mission3 = await db.createMission('Mission Test3', VALID_CAMPAIGN_KEY)
    const mission4 = await db.createMission('Mission Test4', VALID_CAMPAIGN_KEY)
    await db.deactivateMission(mission3.id)
    await db.deactivateMission(mission4.id)
  })

  it('should return 200 with active missions', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/missions`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data.every(({ active }) => active)).toBe(true)
  })

  it('should return 200 with all missions', async () => {
    const { localFetch, db } = components

    const missions = await db.getActiveMissions()

    await db.deactivateGame(missions[0].id)

    const response = await localFetch.fetch(`/api/missions?all`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data.some(({ active }) => !active)).toBe(true)
  })
})
