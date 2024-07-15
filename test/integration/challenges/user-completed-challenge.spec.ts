import { randomUUID } from 'crypto'
import { test } from '../../components'
import { makeRequest } from '../../utils'
import { NON_EXISTING_CAMPAIGN_KEY, VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { RewardL2Status } from '../../../src/types'

test('POST /api/challenges/:id', ({ components }) => {
  it('should return 201 - challenge completed with a reward in progress', async () => {
    const { localFetch, db } = components
    const { id: gameId } = await db.createGame('TEST', '10,10')
    const { id: challengeId } = await db.createGameChallenge(gameId, 'Reach Level 4', 4, VALID_CAMPAIGN_KEY)

    const response = await makeRequest(localFetch, `/api/challenges/${challengeId}`, {
      method: 'POST'
    })
    const rewardResponde = await response.json()
    expect(response.status).toBe(201)
    expect(rewardResponde.data.length).toBeGreaterThan(0)
    expect(rewardResponde.data[0].status).toBe(RewardL2Status.pending)
  })

  it('should return 201 - challenge completed without a reward', async () => {
    const { localFetch, db } = components
    const { id: gameId } = await db.createGame('TEST', '10,10')
    const { id: challengeId } = await db.createGameChallenge(gameId, 'Reach Level 4', 4, NON_EXISTING_CAMPAIGN_KEY)

    const response = await makeRequest(localFetch, `/api/challenges/${challengeId}`, {
      method: 'POST'
    })

    const rewardResponde = await response.json()

    expect(response.status).toBe(201)
    expect(rewardResponde.data.length).toBe(0)
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
