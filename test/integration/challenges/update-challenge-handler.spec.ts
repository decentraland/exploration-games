import { randomUUID } from 'crypto'
import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { uuidSchema } from '../../../src/utils'

test('PATCH /api/challenges/:id', ({ components }) => {
  let game
  let mission
  let challenge
  let payload
  beforeAll(async () => {
    const { db } = components
    game = await db.createGame('TEST', '10,10')
    const wrongGame = await db.createGame('TEST', '10,10')
    mission = await db.createMission('Mission Test', VALID_CAMPAIGN_KEY)
    const wrongMission = await db.createMission('Mission Test', VALID_CAMPAIGN_KEY)

    challenge = await db.createGameChallenge({
      gameId: wrongGame.id,
      description: 'wrong description',
      targetLevel: 4,
      missionId: wrongMission.id
    })

    payload = {
      description: 'Updated description',
      targetLevel: 2,
      gameId: game.id,
      missionId: mission.id
    }
  })

  it('should return 204 created', async () => {
    const { localFetch, db } = components

    const response = await makeRequest(localFetch, `/api/challenges/${challenge.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(204)

    const updatedChallenge = await db.getChallenge(challenge.id)

    expect(updatedChallenge.game_id).toBe(payload.gameId)
    expect(updatedChallenge.description).toBe(payload.description)
    expect(updatedChallenge.mission_id).toBe(payload.missionId)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/challenges/${challenge.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges/${challenge.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, description: 2 })
    })
    expect(response.status).toBe(400)
  })

  it("should return 400 when game doesn't exist", async () => {
    const { localFetch } = components
    const unexistentGameId = randomUUID()
    const response = await makeRequest(localFetch, `/api/challenges/${challenge.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, gameId: unexistentGameId })
    })
    expect(response.status).toBe(400)

    const json = await response.json()

    expect(json.message).toBe(`${unexistentGameId} doesn't exist`)
  })

  it('should return 400 when there is no mission id', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges/${challenge.id}`, {
      method: 'PATCH',
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
      `/api/challenges/${challenge.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
