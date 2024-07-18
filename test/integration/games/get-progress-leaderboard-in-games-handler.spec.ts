import { ProgressSort } from '../../../src/types'
import { test } from '../../components'
import { makeRequest } from '../../utils'

test('GET /api/games/:id/leaderboard', ({ components }) => {
  let game
  beforeAll(async () => {
    const { db } = components
    game = await db.createGame('TEST', '10,10')
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      level: 10,
      score: 2,
      time: 3500,
      moves: 150
    })
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      level: 3,
      score: 10,
      time: 1200,
      moves: 350
    })
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      level: 8,
      score: 4,
      time: 1500,
      moves: 400
    })
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      level: 35,
      score: 300,
      time: 22,
      moves: 11
    })
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      level: 35,
      score: 33,
      time: 200,
      moves: 66
    })
    await db.createProgressInGame(game.id, '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      level: 35,
      score: 32,
      time: 11,
      moves: 600
    })
    await db.createProgressInGame(game.id, '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', {
      level: 35,
      score: 400,
      time: 33,
      moves: 44
    })
    await db.createProgressInGame(game.id, '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', {
      level: 35,
      score: 33,
      time: 100,
      moves: 22
    })
    await db.createProgressInGame(game.id, '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', {
      level: 35,
      score: 33,
      time: 11,
      moves: 700
    })
    await db.createProgressInGame(game.id, '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', {
      level: 4,
      score: 30,
      time: 2550,
      moves: 525
    })
    await db.createProgressInGame(game.id, '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', {
      level: 12,
      score: 16,
      time: 25550,
      moves: 825
    })
    await db.createProgressInGame(game.id, '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', {
      level: 1,
      score: 8,
      time: 3550,
      moves: 1325
    })
  })

  it('should return 200 with all the progress for a game with order by time', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect(body.data[0].level).toBe(35)
    expect(body.data[0].score).toBe(400)
    expect(body.data[0].time).toBe(33)
    expect(body.data[0].moves).toBe(44)
    expect(body.data[1].level).toBe(35)
    expect(body.data[1].score).toBe(300)
    expect(body.data[1].time).toBe(22)
    expect(body.data[1].moves).toBe(11)
  })

  it('should return 200 with all the progress for a game with order by score', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?sort=time`)

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect(body.data[0].level).toBe(35)
    expect(body.data[0].score).toBe(33)
    expect(body.data[0].time).toBe(200)
    expect(body.data[0].moves).toBe(66)
    expect(body.data[1].level).toBe(35)
    expect(body.data[1].score).toBe(33)
    expect(body.data[1].time).toBe(100)
    expect(body.data[1].moves).toBe(22)
  })

  it('should return 200 with all the progress for a game with order by moves', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?sort=moves`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect(body.data[0].level).toBe(35)
    expect(body.data[0].score).toBe(33)
    expect(body.data[0].time).toBe(11)
    expect(body.data[0].moves).toBe(700)
    expect(body.data[1].level).toBe(35)
    expect(body.data[1].score).toBe(32)
    expect(body.data[1].time).toBe(11)
    expect(body.data[1].moves).toBe(600)
  })

  it('should return 200 with all the progress for a game with less moves', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?sort=moves&direction=ASC`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect(body.data[0].level).toBe(35)
    expect(body.data[0].score).toBe(300)
    expect(body.data[0].time).toBe(22)
    expect(body.data[0].moves).toBe(11)
    expect(body.data[1].level).toBe(35)
    expect(body.data[1].score).toBe(33)
    expect(body.data[1].time).toBe(100)
    expect(body.data[1].moves).toBe(22)
  })

  it('should return 200 with all the progress for a game with limit 1', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?limit=1`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(1)
  })

  it('should return 200 with all the progress for a game with limit 1', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?limit=1`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(1)
  })

  it('should return 400 with an error related to a wrong sort option', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?sort=limit`)

    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Bad request')
    expect(body.message).toBe('Invalid sort option')
  })

  it('should return 400', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/aaaaaa/leaderboard`)

    expect(response.status).toBe(400)
  })
})
