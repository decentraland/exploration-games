import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'

test('PATCH /api/games', ({ components }) => {
  let game
  const payload = {
    name: 'Game Updated',
    x: -11,
    y: 11
  }

  beforeAll(async () => {
    const { db } = components
    game = await db.createGame('TEST', '10,10')
  })

  it('should return 204 when game has been updated', async () => {
    const { localFetch, db } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(204)

    const gameUpdated = await db.getGame(game.id)

    expect(gameUpdated.name).toBe('Game Updated')
    expect(gameUpdated.parcel).toBe('-11,11')
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/games/${game.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/games/${game.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, name: 123 })
    })
    expect(response.status).toBe(400)
  })

  it('should return 403 when is not an admin', async () => {
    const { localFetch } = components

    const newIdentity = await getIdentity()

    const response = await makeRequest(
      localFetch,
      `/api/games/${game.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
