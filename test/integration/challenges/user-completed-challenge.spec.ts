import { randomUUID } from 'crypto'
import { test } from '../../components'
import { makeRequest } from '../../utils'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { RewardL2Status } from '../../../src/types'

test('POST /api/challenges/:id', ({ components }) => {
  let challenge1
  let challenge2
  let mission

  beforeAll(async () => {
    const { db } = components
    const { id: gameId } = await db.createGame('TEST', '10,10')
    mission = await db.createMission('Mission Test', VALID_CAMPAIGN_KEY)

    challenge1 = await db.createGameChallenge({
      gameId,
      description: 'Reach Level 4',
      targetLevel: 4,
      missionId: mission.id
    })

    challenge2 = await db.createGameChallenge({
      gameId,
      description: 'Reach Level 5',
      targetLevel: 5,
      missionId: mission.id
    })

    await db.setMissionAsStart('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', mission.id)
  })

  afterAll(async() => {
    const { db } = components

    await db.deleteMissions([mission.id])

  })

  it('should return 200 - challenge completed', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges/${challenge1.id}`, {
      method: 'POST'
    })

    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json.data.mission.id).toBe(mission.id)
    expect(json.data.user_mission.mission_id).toBe(mission.id)
    expect(json.data.user_mission.user_address).toBe('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5')
  })

  it('should return 201 - challenge completed with a reward', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/challenges/${challenge2.id}`, {
      method: 'POST'
    })

    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json.data.mission.id).toBe(mission.id)
    expect(json.data.user_mission.mission_id).toBe(mission.id)
    expect(json.data.user_mission.user_address).toBe('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5')
    expect(json.data.reward.length).toBeGreaterThan(0)
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
