import { MissionType } from '../../../src/types'
import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { getIdentity, makeRequest } from '../../utils'

test('POST /api/missions', ({ components }) => {
  let payload
  beforeAll(async () => {
    payload = {
      description: 'Mission Test',
      campaign_key: VALID_CAMPAIGN_KEY,
      type: MissionType.MINI_GAMES
    }
  })

  it('should return 201 created', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, '/api/missions', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.description).toBe(payload.description)
    expect(body.data.campaign_key).toBe(VALID_CAMPAIGN_KEY)
    expect(body.data.type).toBe(payload.type)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch('/api/missions', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, '/api/missions', {
      method: 'POST',
      body: JSON.stringify({ ...payload, description: 123 })
    })
    expect(response.status).toBe(400)
  })

  it('should return 403 when is not an admin', async () => {
    const { localFetch } = components

    const newIdentity = await getIdentity()

    const response = await makeRequest(
      localFetch,
      '/api/missions',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
