import { randomUUID } from 'crypto'
import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'
import { RewardL2Status } from '../../../src/types'
import { NON_EXISTING_CAMPAIGN_KEY, VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'

test('POST /api/challenges', ({ components }) => {
  it('should return 201 created with a reward in progress', async () => {
    const { localFetch, db, rewardFetch } = components
    const { id } = await db.createGame('TEST', '10,10')
    const campaignKey = VALID_CAMPAIGN_KEY

    const payload = {
      description: 'Reach level 2',
      targetLevel: 2,
      campaignKey: campaignKey
    }

    const response = await makeRequest(localFetch, `/api/games/${id}/challenges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    const rewardResponde = await rewardFetch.sendReward(campaignKey, '0x123')

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.game_id).toBe(id)
    expect(body.data.description).toBe('Reach level 2')
    expect(body.data.campaign_key).toBe(campaignKey)
    expect(rewardResponde.data.length).toBeGreaterThan(0)
    expect(rewardResponde.data[0].status).toBe(RewardL2Status.pending)
  })

  it('should return 201 created without a reward', async () => {
    const { localFetch, db, rewardFetch } = components
    const { id } = await db.createGame('TEST', '10,10')

    const payload = {
      description: 'Reach level 2',
      targetLevel: 2,
      campaignKey: NON_EXISTING_CAMPAIGN_KEY
    }

    const response = await makeRequest(localFetch, `/api/games/${id}/challenges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    const rewardResponde = await rewardFetch.sendReward(NON_EXISTING_CAMPAIGN_KEY, '0x123')

    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.game_id).toBe(id)
    expect(body.data.description).toBe('Reach level 2')
    expect(body.data.campaign_key).toBe(NON_EXISTING_CAMPAIGN_KEY)
    expect(rewardResponde.data.length).toBe(0)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const payload = {
      description: 'Reach level 2',
      targetLevel: 2
    }

    const response = await localFetch.fetch(`/api/games/${randomUUID()}/challenges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch } = components

    const payload = {
      description: 2,
      targetLevel: 2
    }

    const response = await makeRequest(localFetch, `/api/games/${randomUUID()}/challenges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    expect(response.status).toBe(400)
  })

  it("should return 400 when game doesn't exist", async () => {
    const { localFetch } = components

    const gameId = randomUUID()

    const payload = {
      description: 'Reach Level 2',
      targetLevel: 2,
      campaignKey: randomUUID()
    }

    const response = await makeRequest(localFetch, `/api/games/${gameId}/challenges`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    expect(response.status).toBe(400)

    const json = await response.json()

    expect(json.message).toBe(`${gameId} doesn't exist`)
  })

  it('should return 403 when is not an admin', async () => {
    const { localFetch } = components

    const gameId = randomUUID()

    const payload = {
      description: 'Reach Level 2',
      targetLevel: 2
    }
    const newIdentity = await getIdentity()

    const response = await makeRequest(
      localFetch,
      `/api/games/${gameId}/challenges`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
