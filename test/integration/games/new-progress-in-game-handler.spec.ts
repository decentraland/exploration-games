import { test } from '../../components'
import { makeRequest, makeRequestWithBodyModified } from '../../utils'

test('POST /api/games/:id/progress', ({ components }) => {
  it('should return 201 created without data', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')

    const payload = {
      score: 10,
      level: 1,
      time: 150,
      moves: 10,
      user_name: 'user_name'
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
    expect(body.data.user_name).toBe('user_name')
    expect(body.data.data).toBe(null)
  })

  it('should return 201 created with data', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')

    const payload = {
      score: 10,
      level: 1,
      time: 150,
      user_name: 'user_name',
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
    expect(body.data.user_name).toBe('user_name')
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 201 created only with data and level', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')

    const payload = {
      level: 1,
      user_name: 'user_name',
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
    expect(body.data.level).toBe(1)
    expect(body.data.time).toBeNull()
    expect(body.data.moves).toBeNull()
    expect(body.data.user_name).toBe('user_name')
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

  it('should return 400 when payload was modified', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '10,10')
    const payload = {
      score: 10,
      level: 1,
      time: 150,
      moves: 10,
      user_name: 'user_name'
    }

    const response = await makeRequestWithBodyModified(localFetch, `/api/games/${game.id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload),
      bodyModified: JSON.stringify({ ...payload, score: 888888 })
    })
    expect(response.status).toBe(400)
  })

  it('should return 400 when the user is in another scene', async () => {
    const { localFetch, db } = components

    const game = await db.createGame('TEST', '11,10')
    const payload = {
      score: 10,
      level: 1,
      time: 150,
      moves: 10,
      user_name: 'user_name'
    }

    const response = await makeRequestWithBodyModified(localFetch, `/api/games/${game.id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    expect(response.status).toBe(400)
  })
})
