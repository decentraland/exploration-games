import { test } from '../../components'
import { makeRequest } from '../../utils'

test('POST /api/games/:id/progress', ({ components }) => {
  it('should return 201 created without data', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10', 10)

    const payload = {
      level: 1,
      score: 10
    }

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.progress).not.toBe(undefined)
    expect(body.progress.level).toBe(1)
    expect(body.progress.score).toBe(10)
    expect(body.progress.data).toBe(null)
  })

  it('should return 201 created with data', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10', 10)

    const payload = {
      level: 1,
      score: 10,
      data: {
        metadata: true
      }
    }

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.progress).not.toBe(undefined)
    expect(body.progress.level).toBe(1)
    expect(body.progress.score).toBe(10)
    expect(body.progress.data).toEqual({ metadata: true })
  })

  it('should return 400 when no auth', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10', 10)

    const payload = {
      level: 1,
      score: 10,
      data: {
        metadata: true
      }
    }

    const response = await localFetch.fetch(`/api/games/${game.id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10', 10)

    const payload = {
      level: '1a',
      score: 10,
      data: {
        metadata: true
      }
    }

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    expect(response.status).toBe(400)
  })
})
