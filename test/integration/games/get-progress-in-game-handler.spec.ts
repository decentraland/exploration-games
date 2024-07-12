import { test } from '../../components'
import { makeRequest } from '../../utils'

test('GET /api/games/:id/progress', ({ components }) => {
  it('should return 200 with last progress for game', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', 4, 2, {
      metadata: true
    })

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.level).toBe(4)
    expect(body.data.score).toBe(2)
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 200 with max progress for game', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', 10, 2, {
      metadata: true
    })
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', 3, 2, {
      metadata: true
    })

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?option=max`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.level).toBe(10)
    expect(body.data.score).toBe(2)
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 200 with all progress for game', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', 10, 2)
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', 3, 2)
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', 15, 2)

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?option=all`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(3)
    expect(body.data[0].level).toBe(15)
    expect(body.data[0].score).toBe(2)
    expect(body.data[1].level).toBe(3)
    expect(body.data[1].score).toBe(2)
    expect(body.data[2].level).toBe(10)
    expect(body.data[2].score).toBe(2)
  })

  it('should return 400', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/aaaaaa/progress`)

    expect(response.status).toBe(400)
  })
})
