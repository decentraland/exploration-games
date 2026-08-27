import { Authenticator } from '@dcl/crypto'
import { AUTH_METADATA_HEADER } from '@dcl/crypto-middleware'
import { test } from '../../components'
import { admin, getAuthHeaders, getLegacyAuthHeaders } from '../../utils'

const PATH = '/api/games/progress'
const SIGNED_METADATA = { signer: 'decentraland-kernel-scene', parcel: '10,10', realm: { hostname: 'localhost' } }

/**
 * Builds signed-fetch headers for the canonical scene signer, then delivers `deliveredMetadata`
 * instead, leaving the signature untouched.
 *
 * `getAuthHeaders` signs the 6.x payload, which joins the metadata verbatim, so any change to the
 * delivered header — casing included — makes the signature genuinely invalid. These cases still
 * assert a 400 rather than a 401 because `metadataValidator` runs ahead of signature verification:
 * the route refuses the metadata before the signature is ever checked.
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

/**
 * Rewrites one key's spelling while keeping every key in place.
 *
 * Order matters: the legacy payload folds the serialized metadata, so moving a key changes the
 * signed bytes and the request fails on the signature instead of on the spelling being tested.
 */
function respell(metadata: Record<string, unknown>, from: string, to: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key === from ? to : key, value]))
}

/** Signs the pre-6.0.0 folded payload, as the explorer runtime still does, delivering `metadata`. */
function legacySignedHeaders(metadata: Record<string, unknown>, delivered?: Record<string, unknown>) {
  const headers = getLegacyAuthHeaders('GET', PATH, metadata, (payload) =>
    Authenticator.signPayload(
      { ephemeralIdentity: admin.ephemeralIdentity, expiration: new Date(), authChain: admin.authChain },
      payload
    )
  )
  if (delivered) {
    headers[AUTH_METADATA_HEADER] = JSON.stringify(delivered)
  }

  return headers
}

test('when a request carries a scene signer', ({ components }) => {
  // Unlike the services that deny scene traffic, this route's validator *requires* the scene signer,
  // so a mixed-case spelling only ever loses access — there was never an escalation here to close.
  // What these cases pin is which check refuses it, and that legitimate canonical scene traffic
  // still works. Up to 5.1.0 a library guard rejected non-canonical metadata on every request; 6.x
  // removed it, leaving the decision to the service, so `requireSigner` is what answers here now.
  describe('and the canonical signer was signed but a mixed-case spelling is delivered', () => {
    it('should be rejected by the route validator, which requires a canonical scene signer', async () => {
      const response = await components.localFetch.fetch(PATH, {
        headers: signedHeadersDelivering({ ...SIGNED_METADATA, signer: 'Decentraland-Kernel-Scene' })
      })

      expect(response.status).toBe(400)
      // The raw metadata is echoed back truncated at 64 characters, so match the prefix.
      await expect(response.json()).resolves.toEqual({
        ok: false,
        message: expect.stringMatching(/^Invalid metadata content: /)
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

  describe('and the canonical signer is delivered alongside a re-cased duplicate', () => {
    it('should be refused rather than authorized on whichever spelling is read first', async () => {
      // The one case @dcl/crypto-middleware 6.3.0 changes for this route. `requireSigner` fails
      // closed on an absent field, so a re-cased key ALONE was already refused on 6.2.0 -- but the
      // exact key present with a folded duplicate beside it was allowed, because the predicate read
      // the exact key, found the scene signer it wanted, and never looked at the other one.
      //
      // No privilege is gained by it here: the caller is already presenting the canonical scene
      // signer this route requires, and nothing in this service reads `signer` beyond that gate. It
      // is refused because which spelling a reader picks up depends on key order rather than on
      // anything the signature pinned, and that ambiguity should not resolve silently.
      const metadata = { ...SIGNED_METADATA, Signer: 'dcl:explorer' }

      const response = await components.localFetch.fetch(PATH, {
        headers: getAuthHeaders('GET', PATH, metadata, (payload) =>
          Authenticator.signPayload(
            {
              ephemeralIdentity: admin.ephemeralIdentity,
              expiration: new Date(Date.now() + 10 * 60 * 1000),
              authChain: admin.authChain
            },
            payload
          )
        )
      })

      expect(response.status).toBe(400)
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

  // `canonicalMetadataKeys` exists for these. Every caller is a scene signing through the explorer
  // runtime, which still folds the payload, and `hashPayload` is camelCase — so for any request
  // carrying one the folded and 6.x payloads differ and strict verification 401s. With
  // `optional: false` that is a straight loss of access, not a downgrade.
  describe('and the auth chain signs the pre-6.0.0 folded payload', () => {
    let metadata: Record<string, unknown>

    beforeEach(() => {
      // `hashPayload` is what makes folding lossy here; the other keys are already all-lowercase.
      metadata = { ...SIGNED_METADATA, hashPayload: 'ff00ff00' }
    })

    describe('and every declared key is spelled canonically', () => {
      it('should verify through the fallback and reach the handler', async () => {
        const response = await components.localFetch.fetch(PATH, { headers: legacySignedHeaders(metadata) })

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({ data: [] })
      })
    })

    describe.each([
      ['hashPayload', 'HashPayload'],
      ['parcel', 'Parcel'],
      ['signer', 'Signer']
    ])('and the delivered metadata spells %s as %s', (declared, respelled) => {
      it('should be refused rather than authorized on a field the signature never pinned', async () => {
        const response = await components.localFetch.fetch(PATH, {
          headers: legacySignedHeaders(metadata, respell(metadata, declared, respelled))
        })

        // 400, not 401: the declared-key guard inspects the delivered spelling before any signature
        // comparison, so this is refused on the spelling rather than on the folded bytes.
        expect(response.status).toBe(400)
      })
    })

    describe('and an undeclared key is delivered re-cased', () => {
      it('should be accepted, since no authorization decision reads it', async () => {
        // States the boundary: `realm` is not declared, because `validateUserInDCL` is commented out
        // and nothing else reads it. If that check is restored this must become a declared key.
        const response = await components.localFetch.fetch(PATH, {
          headers: legacySignedHeaders(metadata, respell(metadata, 'realm', 'REALM'))
        })

        expect(response.status).toBe(200)
      })
    })
  })
})
