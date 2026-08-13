import { Authenticator } from '@dcl/crypto'
import { AUTH_METADATA_HEADER } from '@dcl/crypto-middleware'
import { test } from '../../components'
import { admin, getAuthHeaders } from '../../utils'

const PATH = '/api/games/progress'
const SIGNED_METADATA = { signer: 'decentraland-kernel-scene', parcel: '10,10', realm: { hostname: 'localhost' } }

/**
 * Builds signed-fetch headers for the canonical scene signer, then delivers `deliveredMetadata`
 * instead. When that differs from SIGNED_METADATA in case alone the signed payload is unchanged —
 * it is lowercased before signing — so the signature stays genuinely valid while the header reads
 * differently to any case-sensitive comparison downstream. A caller that delivers a structurally
 * different object does NOT get a valid signature; see the no-signer case below.
 */
function signedHeadersDelivering(deliveredMetadata: Record<string, unknown>) {
  const headers = getAuthHeaders(
    'GET',
    PATH,
    SIGNED_METADATA,
    (payload) =>
      Authenticator.signPayload(
        { ephemeralIdentity: admin.ephemeralIdentity, expiration: new Date(), authChain: admin.authChain },
        payload
      )
  )
  headers[AUTH_METADATA_HEADER] = JSON.stringify(deliveredMetadata)

  return headers
}

test('when a request carries a scene signer', ({ components }) => {
  // Unlike the services that deny scene traffic, this route's validator *requires* the scene signer,
  // so a mixed-case spelling only ever loses access — there was never an escalation here to close.
  // What these cases pin is that the library guard rejects first, and that legitimate canonical
  // scene traffic still works.
  describe('and the canonical signer was signed but a mixed-case spelling is delivered', () => {
    it('should be rejected by the library guard before the route validator sees it', async () => {
      const response = await components.localFetch.fetch(PATH, {
        headers: signedHeadersDelivering({ ...SIGNED_METADATA, signer: 'Decentraland-Kernel-Scene' })
      })

      expect(response.status).toBe(400)
      // The raw metadata is echoed back truncated at 64 characters, so match the prefix.
      await expect(response.json()).resolves.toEqual({
        ok: false,
        message: expect.stringMatching(/^Invalid chain metadata: /)
      })
    })
  })

  describe('and the canonical signer is delivered exactly as signed', () => {
    it('should authenticate normally and reach the handler', async () => {
      const response = await components.localFetch.fetch(PATH, {
        headers: signedHeadersDelivering(SIGNED_METADATA)
      })

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ data: [] })
    })
  })

  describe('and the request carries no signer at all', () => {
    it('should keep being rejected by the route metadata validator, which requires a scene', async () => {
      // Dropping the key changes the metadata's shape rather than its casing, so this request's
      // signature really is invalid — this is not a signature test. It still reaches the validator's
      // message because verifyMetadata and metadataValidator both run ahead of verifySign.
      const response = await components.localFetch.fetch(PATH, {
        headers: signedHeadersDelivering({ parcel: '10,10', realm: { hostname: 'localhost' } })
      })

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        ok: false,
        message: expect.stringMatching(/^Invalid metadata content: /)
      })
    })
  })
})
