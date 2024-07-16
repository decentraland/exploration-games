import { ProgressSort } from '../../../src/types'
import { test } from '../../components'
import { makeRequest } from '../../utils'

test('GET /api/games/:id/progress', ({ components }) => {
  let game
  beforeAll(async () => {
    const { db } = components
    game = await db.createGame('TEST', '10,10')
    await db.createProgressInGame(
      game.id,
      '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5',
      { level: 10, score: 2, time: 3500, moves: 150 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5',
      { level: 3, score: 10, time: 1200, moves: 350 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5',
      { level: 15, score: 3, time: 200, moves: 65 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5',
      { level: 8, score: 4, time: 1500, moves: 400 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 35, score: 3, time: 1550, moves: 425 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 4, score: 39, time: 2550, moves: 525 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 12, score: 16, time: 25550, moves: 825 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 1, score: 8, time: 3550, moves: 1325 },
      {
        metadata: true
      }
    )
  })

  it('should return 200 sort by level progress for game', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=${ProgressSort.LEVEL}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data[0].level).toBe(15)
    expect(body.data[0].score).toBe(3)
    expect(body.data[0].time).toBe(200)
    expect(body.data[0].moves).toBe(65)
    expect(body.data[0].data).toEqual({ metadata: true })
  })

  it('should return 200 sort by score progress for game and limit by 2', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=${ProgressSort.SCORE}&limit=2`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect(body.data[0].level).toBe(3)
    expect(body.data[0].score).toBe(10)
    expect(body.data[0].time).toBe(1200)
    expect(body.data[0].moves).toBe(350)
    expect(body.data[0].data).toEqual({ metadata: true })
  })

  it('should return 200 sort by time progress for game', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=${ProgressSort.TIME}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBeGreaterThanOrEqual(4)
    expect(body.data[0].level).toBe(10)
    expect(body.data[0].score).toBe(2)
    expect(body.data[0].time).toBe(3500)
    expect(body.data[0].moves).toBe(150)
    expect(body.data[0].data).toEqual({ metadata: true })
  })

  it('should return 200 sort by moves progress for game', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=${ProgressSort.MOVES}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data[0].level).toBe(8)
    expect(body.data[0].score).toBe(4)
    expect(body.data[0].time).toBe(1500)
    expect(body.data[0].moves).toBe(400)
    expect(body.data[0].data).toEqual({ metadata: true })
  })

  it('should return 200 sort by moves progress but limit just to the one with less movements for game', async () => {
    const { localFetch } = components

    const response = await makeRequest(
      localFetch,
      `/api/games/${game.id}/progress?sort=${ProgressSort.MOVES}&limit=1&direction=ASC`
    )

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(1)
    expect(body.data[0].level).toBe(15)
    expect(body.data[0].score).toBe(3)
    expect(body.data[0].time).toBe(200)
    expect(body.data[0].moves).toBe(65)
    expect(body.data[0].data).toEqual({ metadata: true })
  })

  it('should return 400', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/aaaaaa/progress`)

    expect(response.status).toBe(400)
  })
})
