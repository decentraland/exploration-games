import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'
import { randomUUID } from 'crypto'

test('POST /games/progress/delete', ({ components }) => {
    let game
    let progress1

    beforeAll(async () => {
        const { db } = components
        game = await db.createGame('TEST', '10,10')
        progress1 = await db.createProgressInGame(
            game.id,
            { userAddress: '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', userName: 'userName1' },
            {
                level: 10,
                score: 2,
                time: 3500,
                moves: 150
            }
        )
    })

    afterAll(async () => {
        const { db } = components
        await db.deleteGames([game.id])
    })

    it('should return 200 when setting deleted_at', async () => {
        const { localFetch, pg } = components

        const payload = {
            ids: [progress1.id]
        }

        const response = await makeRequest(localFetch, '/api/games/progress/delete', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        expect(response.status).toBe(200)
    })

    it('should return 200 when setting isNull', async () => {
        const { localFetch, pg } = components

        const payload = {
            ids: [progress1.id],
            isNull: true
        }

        const response = await makeRequest(localFetch, '/api/games/progress/delete', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        expect(response.status).toBe(200)
    })
    
    it('should return 400 when not uuid', async () => {
        const { localFetch } = components

        const payload = {
            ids: ["aaaaa"]
        }

        const response = await makeRequest(localFetch, '/api/games/progress/delete', {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        expect(response.status).toBe(400)
    })

    it('should return 400 when no auth', async () => {
        const { localFetch } = components

        const payload = {
            ids: [progress1.id]
        }

        const response = await localFetch.fetch('/api/games/progress/delete', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        expect(response.status).toBe(400)
    })

    it('should return 403 when is not an admin', async () => {
        const { localFetch } = components

        const payload = {
            ids: [progress1.id]
        }

        const newIdentity = await getIdentity()

        const response = await makeRequest(
            localFetch,
            '/api/games/progress/delete',
            {
                method: 'POST',
                body: JSON.stringify(payload)
            },
            newIdentity
        )
        expect(response.status).toBe(403)
    })
})
