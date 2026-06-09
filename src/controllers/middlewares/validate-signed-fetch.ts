import { InvalidRequestError } from '@dcl/platform-server-commons'
import { AppComponents, DecentralandSignatureMetadata } from '../../types'
import { createHash } from 'crypto'
import { DecentralandSignatureContext } from '@dcl/platform-crypto-middleware'

type SingedFetchContext = DecentralandSignatureContext<DecentralandSignatureMetadata> & {
  components: Pick<AppComponents, 'db'>
}

export async function validateSignedFetch(
  ctx: SingedFetchContext,
  opts?: { gameId?: string; body?: unknown; skipParcelValidation?: boolean }
) {
  if (!opts?.skipParcelValidation && opts?.gameId) {
    await validateGameParcel(ctx, opts.gameId)
  }
  if (opts?.body) {
    await validateBody(ctx, opts.body)
  }

  // Always verify the signer is actually connected in DCL (presence). The parcel
  // match is only enforced when this is not a "visit" (skipParcelValidation),
  // so visits still work while progress can no longer be claimed from outside.
  await validateUserInDCL(ctx, !opts?.skipParcelValidation)
}

export async function validateGameParcel(ctx: SingedFetchContext, gameId: string) {
  const { components } = ctx
  const game = await components.db.getGame(gameId)
  const gameCoords = getCoords(game.parcel)
  const authCoords = ctx.verification?.authMetadata.parcel && getCoords(ctx.verification?.authMetadata.parcel)

  if (!authCoords || !sameCoords(gameCoords, authCoords)) {
    throw new InvalidRequestError('Invalid request. User must be inside the scene')
  }
}

export function hashSha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function getCoords(parcel: string): [number, number] {
  const [x, y] = parcel.split(',').map((item: string) => parseInt(item, 10))
  return [x, y]
}

function sameCoords(coordsA: [number, number], coordsB: [number, number]) {
  return coordsA[0] === coordsB[0] && coordsA[1] === coordsB[1]
}

export async function validateBody(ctx: SingedFetchContext, body: unknown) {
  if (
    // ctx.verification?.authMetadata.hashPayload &&
    hashSha256(JSON.stringify(body)) !== ctx.verification?.authMetadata.hashPayload
  ) {
    throw new InvalidRequestError('Invalid body')
  }
}

export async function validateUserInDCL(ctx: SingedFetchContext, validateParcel: boolean) {
  const userAddress = ctx.verification?.auth
  const parcel = ctx.verification?.authMetadata?.parcel

  let hostname = ctx.verification?.authMetadata?.realm?.hostname

  if (!hostname || !userAddress || !parcel) {
    throw new InvalidRequestError('Invalid signature')
  }

  // The "main" realm resolves to a fixed, trusted stats host.
  if (ctx.verification?.authMetadata.realm.serverName === 'main') {
    hostname = 'https://archipelago-ea-stats.decentraland.org'
  }

  // realm.hostname is client-signed and may omit the scheme. Normalize it and
  // parse it ONCE, so every check below runs on the parsed URL instead of naive
  // substring matching that crafted URLs can defeat.
  if (!/^https?:\/\//i.test(hostname)) {
    hostname = `https://${hostname}`
  }
  let realmUrl: URL
  try {
    realmUrl = new URL(hostname)
  } catch {
    throw new InvalidRequestError('Invalid realm hostname')
  }
  const realmHost = realmUrl.hostname

  // localhost is only allowed (and skips validation) outside production.
  if ((realmHost === 'localhost' || realmHost === '127.0.0.1') && process.env.NODE_ENV !== 'production') {
    return
  }

  // We can't validate presence through worlds.
  if (realmHost.includes('worlds-content-server')) {
    throw new InvalidRequestError('Worlds is not supported')
  }

  // Restrict the peers lookup to trusted Decentraland realms. Without this the
  // lookup is an SSRF (e.g. http://169.254.169.254/...) and is bypassable by
  // pointing at an attacker-controlled /comms/peers returning a forged peer list.
  if (realmUrl.protocol !== 'https:' || !(realmHost === 'decentraland.org' || realmHost.endsWith('.decentraland.org'))) {
    throw new InvalidRequestError('Realm hostname not allowed')
  }

  let data: PeerResponse
  try {
    // Use only the validated origin; never the raw client value, which could
    // carry an attacker-controlled path/query.
    data = (await (await fetch(`${realmUrl.origin}/comms/peers`)).json()) as PeerResponse
  } catch (e) {
    throw new InvalidRequestError('Could not validate user in DCL')
  }

  const player = (data?.peers ?? []).find(
    (peer) => peer.address && peer.address.toLowerCase() === userAddress.toLowerCase()
  )

  if (data.ok && player && (!validateParcel || sameCoords(getCoords(parcel), player.parcel))) {
    return
  }

  throw new InvalidRequestError('Player outside Scene')
}

export type PeerResponse = {
  ok: boolean
  peers: {
    id: string
    address: string
    lastPing: number
    parcel: [number, number]
    position: [number, number, number]
  }[]
}
