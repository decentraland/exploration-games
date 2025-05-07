import { ProgressSort } from '../../../src/types'
import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'

test('GET /games/:id/progress/all', ({ components }) => {
    let game
    beforeAll(async () => {
        const { db } = components
        game = await db.createGame('TEST', '10,10')

        const fstUserProgress = [
            { level: 10, score: 2, time: 3500, moves: 150 },
            { level: 3, score: 10, time: 1200, moves: 350 },
            { level: 15, score: 3, time: 200, moves: 65 },
            { level: 8, score: 4, time: 1500, moves: 400 },
        ]

        const sndUserProgress = [
            { level: 35, score: 3, time: 1550, moves: 425 },
            { level: 4, score: 39, time: 2550, moves: 525 },
            { level: 12, score: 16, time: 25550, moves: 825 },
            { level: 1, score: 8, time: 3550, moves: 1325 },
        ]

        for (const progress of fstUserProgress) {
            await db.createProgressInGame(
                game.id,
                { userAddress: '0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', userName: 'UserName1' },
                progress,
                {
                    metadata: true
                }
            )
            await new Promise((r) => setTimeout(r, 1))
        }

        for (const progress of sndUserProgress) {
            await db.createProgressInGame(
                game.id,
                { userAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', userName: 'UserName2' },
                progress,
                {
                    metadata: true
                }
            )
            await new Promise((r) => setTimeout(r, 1))
        }
    })

    afterAll(async () => {
        const { db } = components
        await db.deleteGames([game.id])
    })

    it('should return 200 sort by level progress for game', async () => {
        const { localFetch } = components

        const response = await makeRequest(localFetch, `/api/games/${game.id}/progress/all?sort=${ProgressSort.LEVEL}`)

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data).not.toBe(undefined)
        expect({
            data: [{
                level: 35,
                score: 3,
                time: 1550,
                moves: 425,
                data: { metadata: true }
            }]
        })
    })

    it('should return 200 sort by score progress for game and limit by 2', async () => {
        const { localFetch } = components

        const response = await makeRequest(localFetch, `/api/games/${game.id}/progress/all?sort=${ProgressSort.SCORE}&limit=2`)

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data).not.toBe(undefined)
        expect(body.data.length).toBe(2)
        expect({
            data: [{
                level: 4,
                score: 39,
                time: 2550,
                moves: 525,
                data: { metadata: true }
            }]
        })
    })

    it('should return 200 sort by time progress for game', async () => {
        const { localFetch } = components

        const response = await makeRequest(localFetch, `/api/games/${game.id}/progress/all?sort=${ProgressSort.TIME}`)

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data).not.toBe(undefined)
        expect(body.data.length).toBeGreaterThanOrEqual(4)
        expect({
            data: [{
                level: 12,
                score: 16,
                time: 25550,
                moves: 825,
                data: { metadata: true }
            }]
        })
    })

    it('should return 200 sort by moves progress for game', async () => {
        const { localFetch } = components

        const response = await makeRequest(localFetch, `/api/games/${game.id}/progress/all?sort=${ProgressSort.MOVES}`)

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data).not.toBe(undefined)
        expect({
            data: [{
                level: 1,
                score: 8,
                time: 3550,
                moves: 1325,
                data: { metadata: true }
            }]
        })
    })

    it('should return 200 sort by moves progress but limit just to the one with less movements for game', async () => {
        const { localFetch } = components

        const response = await makeRequest(
            localFetch,
            `/api/games/${game.id}/progress/all?sort=${ProgressSort.MOVES}&limit=1&direction=ASC`
        )

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data).not.toBe(undefined)
        expect(body.data.length).toBe(1)
        expect({
            data: [{
                level: 15,
                score: 3,
                time: 200,
                moves: 65,
                data: { metadata: true }
            }]
        })
    })

    it('should return 200 filter by level', async () => {
        const { localFetch } = components

        const response = await makeRequest(
            localFetch,
            `/api/games/${game.id}/progress/all?level=15`
        )

        expect(response.status).toBe(200)

        const body = await response.json()

        expect(body.data).not.toBe(undefined)
        expect(body.data.length).toBe(1)
        expect({
            data: [{
                level: 15,
                score: 3,
                time: 200,
                moves: 65,
                data: { metadata: true }
            }]
        })
    })

    it('should return 200 with fourth page of 2 results', async () => {
        const { localFetch } = components

        const response = await makeRequest(
            localFetch,
            `/api/games/${game.id}/progress/all?sort=time&limit=2&page=4`
        )

        expect(response.status).toBe(200)

        const body = await response.json()
        expect(body.data).not.toBe(undefined)
        expect(body.data.length).toBe(2)
        expect({
            data: [{
                level: 3,
                time: 1200,
                moves: 350,
                score: 10,
                data: { metadata: true }
            },
            {
                level: 15,
                time: 200,
                moves: 65,
                score: 3,
                data: { metadata: true }
            }]
        })
    })

    it('should return 400 when not an uuid', async () => {
        const { localFetch } = components

        const response = await makeRequest(localFetch, `/api/games/aaaaaa/progress/all`)

        expect(response.status).toBe(400)
    })

    it('should return 400 when no auth', async () => {
        const { localFetch } = components

        const response = await localFetch.fetch(`/api/games/${game.id}/progress/all`)

        expect(response.status).toBe(400)
    })

    it('should return 403 when is not an admin', async () => {
        const { localFetch } = components

        const newIdentity = await getIdentity()

        const response = await makeRequest(
            localFetch,
            `/api/games/${game.id}/progress/all`,
            {},
            newIdentity
        )
        expect(response.status).toBe(403)
    })
})
