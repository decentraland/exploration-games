import { test } from '../../components'
import { makeRequest } from '../../utils'

test('POST /api/games/:id/progress', ({ components }) => {
  it('should return 201 created without data', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')

    const payload = {
      score: 10,
      level: 1,
      time: 150,
      moves: 10
    }

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.score).toBe(10)
    expect(body.data.level).toBe(1)
    expect(body.data.time).toBe(150)
    expect(body.data.moves).toBe(10)
    expect(body.data.data).toBe(null)
  })

  it('should return 201 created with data', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')

    const payload = {
      score: 10,
      level: 1,
      time: 150,
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

    expect(body.data).not.toBe(undefined)
    expect(body.data.score).toBe(10)
    expect(body.data.level).toBe(1)
    expect(body.data.time).toBe(150)
    expect(body.data.moves).toBeNull()
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 201 created only with data', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')

    const payload = {
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

    expect(body.data).not.toBe(undefined)
    expect(body.data.score).toBeNull()
    expect(body.data.level).toBeNull()
    expect(body.data.time).toBeNull()
    expect(body.data.moves).toBeNull()
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 400 when no auth', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')

    const payload = {
      score: 10,
      level: 1,
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

    const game = await db.createGame('TEST', '10,10')

    const payload = {
      score: 'abc',
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
