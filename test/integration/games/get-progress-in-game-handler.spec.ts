import { progressSort } from '../../../src/types'
import { test } from '../../components'
import { makeRequest } from '../../utils'

test('GET /api/games/:id/progress', ({ components }) => {
  const { localFetch, db } = components
  let game
  beforeAll(async () => {
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
      { level: 3, score: 10, time: 4200, moves: 350 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5',
      { level: 15, score: 7, time: 2000, moves: 650 },
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
  })

  it.only('should return 200 sort by last progress for game', async () => {
    const { localFetch, db } = components
    game = await db.createGame('TEST', '10,10')
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 1, score: 3, time: 1550, moves: 425 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 4, score: 9, time: 2550, moves: 525 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 12, score: 16, time: 5550, moves: 825 },
      {
        metadata: true
      }
    )
    await db.createProgressInGame(
      game.id,
      '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
      { level: 1, score: 8, time: 3550, moves: 325 },
      {
        metadata: true
      }
    )

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.level).toBe(8)
    expect(body.data.score).toBe(4)
    expect(body.data.time).toBe(1500)
    expect(body.data.moves).toBe(400)
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 200 sort by score progress for game', async () => {
    const { localFetch, db } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=${progressSort.SCORE}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.level).toBe(3)
    expect(body.data.score).toBe(10)
    expect(body.data.time).toBe(4200)
    expect(body.data.moves).toBe(350)
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 200 sort by time progress for game', async () => {
    const { localFetch, db } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=${progressSort.TIME}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.level).toBe(10)
    expect(body.data.score).toBe(2)
    expect(body.data.time).toBe(3500)
    expect(body.data.moves).toBe(150)
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 200 sort by moves progress for game', async () => {
    const { localFetch, db } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=${progressSort.MOVES}`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.level).toBe(15)
    expect(body.data.score).toBe(7)
    expect(body.data.time).toBe(2000)
    expect(body.data.moves).toBe(650)
    expect(body.data.data).toEqual({ metadata: true })
  })

  it('should return 200 with all progress for game', async () => {
    const { localFetch, db } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/progress?sort=all`)

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
