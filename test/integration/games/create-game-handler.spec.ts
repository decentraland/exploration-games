import { test } from '../../components'
import { getIdentity, makeRequest } from '../../utils'

test('POST /api/games', ({ components }) => {
  it('should return 201 created', async () => {
    const { localFetch } = components

    const payload = {
      name: 'Test Game',
      x: 10,
      y: 10
    }
    const response = await makeRequest(localFetch, '/api/games', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(201)

    const body = await response.json()

    expect(body.data).not.toBe(undefined)
    expect(body.data.name).toBe('Test Game')
    expect(body.data.parcel).toBe('10,10')
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const payload = {
      name: 'Test Game',
      x: 10,
      y: 10
    }

    const response = await localFetch.fetch('/api/games', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 when bad payload', async () => {
    const { localFetch } = components

    const payload = {
      name: 123,
      x: 10,
      y: 10
    }

    const response = await makeRequest(localFetch, '/api/games', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    expect(response.status).toBe(400)
  })

  it('should return 403 when is not an admin', async () => {
    const { localFetch } = components

    const payload = {
      name: 'Test Game',
      x: 10,
      y: 10
    }

    const newIdentity = await getIdentity()

    const response = await makeRequest(
      localFetch,
      '/api/games',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      newIdentity
    )
    expect(response.status).toBe(403)
  })
})
