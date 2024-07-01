import { test } from '../../components'
import { makeRequest } from '../../utils'

test('GET /api/games/:id/progress', ({ components }) => {
  it('should return 200 with progress for game', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10', 10)
    await db.upsertProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', 2, 10, {
      metadata: true
    })

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.progress).not.toBe(undefined)
    expect(body.progress.level).toBe(2)
    expect(body.progress.score).toBe(10)
    expect(body.progress.data).toEqual({ metadata: true })
  })

  it('should return 400', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/aaaaaa/progress`)

    expect(response.status).toBe(400)
  })
})
