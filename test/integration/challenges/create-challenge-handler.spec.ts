import { randomUUID } from 'crypto'
import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { MissionType } from '../../../src/types'
test('POST /api/challenges', ({ components }) => {
  let game
  let mission
  let payload
  beforeAll(async () => {
    const { db } = components
    game = await db.createGame('TEST', '10,10')
    mission = await db.createMission('Mission Test', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES)
  })

  beforeEach(() => {
    payload = {
      description: 'Reach level 2',
      targetLevel: 2,
      gameId: randomUUID(),
      missionId: mission.id
    }
  })

  it('should return 201 created', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, gameId: game.id })
    })

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.game_id).toBe(game.id)
    expect(body.data.description).toBe('Reach level 2')
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/challenges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, description: 2 })
    })
    expect(response.status).toBe(400)
  })

  it("should return 400 when game doesn't exist", async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    expect(response.status).toBe(400)

    const json = await response.json()

    expect(json.message).toBe(`${payload.gameId} doesn't exist`)
  })

  it('should return 400 when there is no mission id', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, missionId: undefined })
    })
    expect(response.status).toBe(400)

    const json = await response.json()

    expect(json.message).toBe(`\"missionId\" is required`)
  })

  it('should return 403 when is not an admin', async () => {
    const { localFetch } = components

    const newIdentity = await getIdentity()

    const response = await makeRequest(
      localFetch,
      `/api/challenges`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
