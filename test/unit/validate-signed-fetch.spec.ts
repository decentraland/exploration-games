import { validateUserInDCL } from '../../src/controllers/middlewares/validate-signed-fetch'

const USER = '0x1111111111111111111111111111111111111111'

function makeCtx(hostname: string, opts?: { serverName?: string; parcel?: string; auth?: string }) {
  return {
    verification: {
      auth: opts?.auth ?? USER,
      authMetadata: {
        parcel: opts?.parcel ?? '0,0',
        realm: { hostname, serverName: opts?.serverName ?? 'realm-name' }
      }
    },
    components: {}
  } as any
}

describe('validateUserInDCL — realm host SSRF guard', () => {
  const originalFetch = global.fetch
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ ok: true, peers: [{ address: USER, parcel: [0, 0] }] })
    })
    global.fetch = mockFetch as any
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('rejects a non-https realm hostname', async () => {
    await expect(validateUserInDCL(makeCtx('http://peer-ec1.decentraland.org'), false)).rejects.toThrow(
      'Realm hostname not allowed'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects a hostname outside *.decentraland.org', async () => {
    await expect(validateUserInDCL(makeCtx('https://evil.com'), false)).rejects.toThrow('Realm hostname not allowed')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects a suffix-spoofing hostname (decentraland.org.evil.com)', async () => {
    await expect(validateUserInDCL(makeCtx('https://decentraland.org.evil.com'), false)).rejects.toThrow(
      'Realm hostname not allowed'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects the cloud metadata endpoint', async () => {
    await expect(validateUserInDCL(makeCtx('http://169.254.169.254'), false)).rejects.toThrow(
      'Realm hostname not allowed'
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('accepts a trusted realm and fetches only the validated origin', async () => {
    await expect(validateUserInDCL(makeCtx('https://peer-ec1.decentraland.org/evil?x=1'), false)).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith('https://peer-ec1.decentraland.org/comms/peers')
  })

  it('rejects when the user is not present in the realm peers', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ ok: true, peers: [] }) })
    await expect(validateUserInDCL(makeCtx('https://peer-ec1.decentraland.org'), false)).rejects.toThrow(
      'Player outside Scene'
    )
  })
})
