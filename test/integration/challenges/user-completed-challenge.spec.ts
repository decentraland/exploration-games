import { randomUUID } from 'crypto'
import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'

test('POST /api/challenges/:id', ({ components }) => {
  it('should return 201 - challenge completed', async () => {
    const { localFetch, db } = components

    const { id: gameId } = await db.createGame('TEST', '10,10')
    const { id: challengeId } = await db.createGameChallenge(gameId, 'Reach Level 4')

    const response = await makeRequest(localFetch, `/api/challenges/${challengeId}`, {
      method: 'POST'
    })

    expect(response.status).toBe(201)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch('/api/challenges/' + randomUUID(), {
      method: 'POST'
    })

    expect(response.status).toBe(400)
  })

  it("should return 400 when challenge doesn't exist", async () => {
    const { localFetch } = components

    const challengeId = randomUUID()

    const response = await makeRequest(localFetch, '/api/challenges/' + challengeId, {
      method: 'POST'
    })
    expect(response.status).toBe(400)

    const json = await response.json()

    expect(json.message).toBe(`${challengeId} doesn't exist`)
  })
})
