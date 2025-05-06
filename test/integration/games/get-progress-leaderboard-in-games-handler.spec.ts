import { test } from '../../components'
import { makeRequest } from '../../utils'

test('GET /api/games/:id/leaderboard', ({ components }) => {
  let game
  beforeAll(async () => {
    const { db } = components
    game = await db.createGame('TEST', '10,10')

    const fstUserProgress = [
      { level: 10, score: 2, time: 3500, moves: 150 },
      { level: 3, score: 10, time: 1200, moves: 350 },
      { level: 8, score: 4, time: 1500, moves: 400 },
      { level: 35, score: 300, time: 22, moves: 11 },
      { level: 35, score: 33, time: 200, moves: 66 },
      { level: 35, score: 32, time: 11, moves: 600 }
    ]

    const scndUserProgress = [
      { level: 35, score: 400, time: 33, moves: 44 },
      { level: 35, score: 33, time: 100, moves: 22 },
      { level: 35, score: 33, time: 11, moves: 700 },
      { level: 4, score: 30, time: 2550, moves: 525 },
      { level: 12, score: 16, time: 25550, moves: 825 },
      { level: 1, score: 8, time: 3550, moves: 1325 }
    ]

    for (const progress of fstUserProgress) {
      await db.createProgressInGame(
        game.id,
        { userAddress: '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', userName: 'userName1' },
        progress
      )
      //TODO: timeout in order to avoid creating elements with repeated timestamps
      await new Promise((r) => setTimeout(r, 1))
    }

    for (const progress of scndUserProgress) {
      await db.createProgressInGame(
        game.id,
        { userAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', userName: 'userName2' },
        progress
      )
      await new Promise((r) => setTimeout(r, 1))
    }

  })
  afterAll(async () => {
    const { db } = components
    await db.deleteGames([game.id])
    console.log("deleted game")
  })

  it('should return 200 with 2 progress (one for each user) for a game with order by score', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard`)

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect({
      data: [
        {
          level: 35,
          score: 400,
          time: 33,
          moves: 35
        },
        {
          level: 35,
          score: 300,
          time: 22,
          moves: 11
        }
      ]
    })
  })

  it('should return 200 with all the progress for a game with order by time', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?sort=time`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect({
      data: [
        {
          level: 35,
          score: 33,
          time: 200,
          moves: 66
        },
        {
          level: 35,
          score: 33,
          time: 100,
          moves: 22
        }
      ]
    })
  })

  it('should return 200 with all the progress for a game with order by moves', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?sort=moves`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect({
      data: [
        {
          level: 35,
          score: 33,
          time: 11,
          moves: 700
        },
        {
          level: 35,
          score: 32,
          time: 11,
          moves: 600
        }
      ]
    })
  })

  it('should return 200 with all the progress for a game with less moves', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}/leaderboard?sort=moves&direction=ASC`)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.data).not.toBe(undefined)
    expect(body.data.length).toBe(2)
    expect({
      data: [
        {
          level: 35,
          score: 300,
          time: 22,
          moves: 11
        },
        {
          level: 35,
          score: 32,
          time: 100,
          moves: 22
        }
      ]
    })
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
