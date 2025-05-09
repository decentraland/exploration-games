import { test } from '../../components'
import { makeRequest } from '../../utils'

// Integration tests for POST /multiplayer/progress

test('POST /api/multiplayer/progress', ({ components }) => {
    let game

    beforeAll(async () => {
        const { db } = components
        game = await db.createGame('TEST', '10,10')
    })

    afterAll(async () => {
        const { db } = components
        if (game) await db.deleteGames([game.id])
    })

    it('should return 201 created with valid payload and api key', async () => {
        const { localFetch } = components

        const payload = {
            game_id: game.id,
            scores: [
                {
                    user_address: '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5',
                    user_name: 'user_name',
                    level: 2,
                    score: 100,
                    time: 200,
                    moves: 15,
                    data: { extra: true }
                },
                {
                    user_address: '0x84452bbFA4ca14B7828e2F3BBd106A2bD495CD34',
                    user_name: 'another_user',
                    level: 1,
                    score: 50,
                    time: 220,
                    moves: 16,
                    data: { extra: true }
                }
            ]
        }

        const authKey = "testKey198fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

        const response = await localFetch.fetch('/api/multiplayer/progress', {
            headers: {
                "Authorization": `Bearer ${authKey}`
            },
            method: 'POST',
            body: JSON.stringify(payload)
        })

        expect(response.status).toBe(201)
        const body = await response.json()
        expect(body.data).not.toBe(undefined)
        expect(body.data.length).toBe(2)
        expect(body.data[0].game_id).toBe(game.id)
        expect(body.data[0].user_name).toBe('user_name')
        expect(body.data[1].user_name).toBe('another_user')
    })

    it('should return 400 when wrong userAddress format', async () => {
        const { localFetch } = components
        const payload = {
            game_id: game.id,
            scores: [
                {
                    user_address: '0x7949f9f23816ce5eb364a1f588ae9cc1bf5',
                    user_name: 'user_name',
                    level: 2,
                    score: 100,
                    time: 200,
                    moves: 15,
                    data: { extra: true }
                },
                {
                    user_address: '0x84452bbFA4ca14B7828e2F3BBd106A2bD495CD34',
                    user_name: 'another_user',
                    level: 1,
                    score: 50,
                    time: 220,
                    moves: 16,
                    data: { extra: true }
                }
            ]
        }

        const authKey = "testKey198fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

        const response = await localFetch.fetch('/api/multiplayer/progress', {
            method: 'POST', headers: {
                "Authorization": `Bearer ${authKey}`
            },
            body: JSON.stringify(payload)
        })
        expect(response.status).toBe(400)
    })

    it('should return 403 when api key is invalid', async () => {
        const { localFetch } = components
        const payload = {
            game_id: game.id,
            scores: [
                {
                    user_address: '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5',
                    user_name: 'user_name',
                    level: 2,
                    score: 100,
                    time: 200,
                    moves: 15,
                    data: { extra: true }
                },
                {
                    user_address: '0x84452bbFA4ca14B7828e2F3BBd106A2bD495CD34',
                    user_name: 'another_user',
                    level: 1,
                    score: 50,
                    time: 220,
                    moves: 16,
                    data: { extra: true }
                }
            ]
        }

        const authKey = "wrongApiKey"

        const response = await localFetch.fetch('/api/multiplayer/progress', {
            method: 'POST', headers: {
                "Authorization": `Bearer ${authKey}`
            },
            body: JSON.stringify(payload)
        })
        expect(response.status).toBe(403)
    })
}) 