import SQL from 'sql-template-strings'
import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'
import { randomUUID } from 'crypto'

test('PUT /api/games/:id/deactivate', ({ components }) => {
  it('should return 204 updated', async () => {
    const { localFetch, db, pg } = components

    const { id } = await db.createGame('test', '10,10', 10)

    const response = await makeRequest(localFetch, `/api/games/${id}/deactivate`, {
      method: 'PATCH'
    })

    expect(response.status).toBe(204)

    const { rows } = await pg.query(SQL`SELECT active FROM games where id = ${id}`)
    expect(rows[0].active).toBe(false)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/games/${randomUUID()}/deactivate`, {
      method: 'PATCH'
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when not uuid', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, '/api/games/aaaaaaa/deactivate', {
      method: 'PATCH'
    })
    expect(response.status).toBe(400)
  })

  it('should return 403 when is not an admin', async () => {
    const { localFetch } = components

    const newIdentity = await getIdentity()

    const response = await makeRequest(
      localFetch,
      `/api/games/${randomUUID()}/deactivate`,
      {
        method: 'PATCH'
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
