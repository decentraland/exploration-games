import { test } from '../../components'
import { VALID_CAMPAIGN_KEY, NON_EXISTING_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { getIdentity, makeRequest } from '../../utils'

test('POST /api/missions', ({ components }) => {
  let mission
  const payload = {
    description: 'Mission Updated',
    campaign_key: NON_EXISTING_CAMPAIGN_KEY
  }

  beforeAll(async () => {
    const { db } = components
    mission = await db.createMission('TEST Mission User 1', VALID_CAMPAIGN_KEY)
  })

  afterAll(async () => {
    const { db } = components
    await db.deleteMissions(mission.id)
  })

  it('should return 204 when updating a mission', async () => {
    const { localFetch, db } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(204)

    const missionUpdated = await db.getMissionWithCampaignKeyExposure(mission.id)

    expect(await missionUpdated.description).toBe(payload.description)
    expect(await missionUpdated.campaign_key).toBe(payload.campaign_key)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/missions/${mission.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, description: 123 })
    })
    expect(response.status).toBe(400)
  })

  it('should return 403 when is not an admin', async () => {
    const { localFetch } = components

    const newIdentity = await getIdentity()

    const response = await makeRequest(
      localFetch,
      `/api/missions/${mission.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
