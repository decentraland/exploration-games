import { test } from '../../components'

test('GET /api/games', ({ components }) => {
  it('should return 200 with active games', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/games`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data.every(({ active }) => active)).toBe(true)
  })

  it('should return 200 with all games', async () => {
    const { localFetch, db } = components

    const games = await db.getActiveGames()

    await db.deactivateGame(games[0].id)

    const response = await localFetch.fetch(`/api/games?all`)

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.data.length).toBeGreaterThan(0)
    expect(json.data.some(({ active }) => !active)).toBe(true)
  })
})
