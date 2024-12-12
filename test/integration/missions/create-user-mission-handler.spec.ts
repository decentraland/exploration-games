import { randomUUID } from 'crypto'
import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { getIdentity, makeRequest, admin } from '../../utils'

test('POST /api/missions/:id/start', ({ components }) => {
  let mission

  beforeAll(async () => {
    const { db } = components
    const { id: gameId } = await db.createGame('TEST', '10,10')
    mission = await db.createMission('Mission Test', VALID_CAMPAIGN_KEY)
  })

  it('should return 204 created', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission.id}/start`, {
      method: 'POST'
    })

    expect(response.status).toBe(204)
  })

  it('should return 400 created', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/${mission.id}/start`, {
      method: 'POST'
    })

    const json = await response.json()

    console.log(' >>>> response >>> ', response)
    console.log(' >>>> json.message >>> ', json.message)
    const user = admin.authChain[0].payload
    expect(response.status).toBe(400)
    expect(json.message).toBe(
      `Error trying to start the mission id ${mission.id} for the user ${user}: error: duplicate key value violates unique constraint \"user_missions_user_address_mission_id_unique_index\"`
    )
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
