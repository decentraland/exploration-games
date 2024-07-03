import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'

test('GET /api/games/progress', ({ components }) => {
  it('should return 200 with all progress for played games', async () => {
    const { localFetch, db } = components
    const game1 = await db.createGame('TEST', '10,10', 10)
    const game2 = await db.createGame('TEST 2', '15,10', 10)

    const identity = await getIdentity()

    await db.upsertProgressInGame(game1.id, identity.authChain[0].payload.toLowerCase(), 5, 10)
    await db.upsertProgressInGame(game2.id, identity.authChain[0].payload.toLowerCase(), 3, 10)

    const response = await makeRequest(localFetch, '/api/games/progress', {}, identity)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.playedGames.length).toBe(2)
    expect(json.playedGames[0].name).toBe('TEST')
    expect(json.playedGames[0].parcel).toBe('10,10')
    expect(json.playedGames[0].max_levels).toBe(10)
    expect(json.playedGames[0].level).toBe(5)
    expect(json.playedGames[0].score).toBe(10)
    expect(json.playedGames[1].name).toBe('TEST 2')
    expect(json.playedGames[1].parcel).toBe('15,10')
    expect(json.playedGames[1].max_levels).toBe(10)
    expect(json.playedGames[1].level).toBe(3)
    expect(json.playedGames[1].score).toBe(10)
  })
})
