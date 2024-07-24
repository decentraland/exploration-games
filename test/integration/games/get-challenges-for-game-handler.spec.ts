import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'

test('GET /api/games/:id/challenges', ({ components }) => {
  it('should return 200 with challenges for game', async () => {
    const { localFetch, db } = components
    const { id } = await db.createGame('TEST', '10,10')
    const mission = await db.createMission('Mission Test', VALID_CAMPAIGN_KEY)
    const challenge = await db.createGameChallenge(id, 'Reach level 6', 6, mission.id)

    const response = await localFetch.fetch(`/api/games/${id}/challenges`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBe(1)
    expect(json.data[0].id).toBe(challenge.id)
    expect(json.data[0].target_level).toBe(challenge.target_level)
  })
})
