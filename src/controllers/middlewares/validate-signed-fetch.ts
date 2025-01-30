import { InvalidRequestError } from '@dcl/platform-server-commons'
import { AppComponents, DecentralandSignatureMetadata } from '../../types'
import { createHash } from 'crypto'
import { DecentralandSignatureContext } from '@dcl/platform-crypto-middleware'

type SingedFetchContext = DecentralandSignatureContext<DecentralandSignatureMetadata> & {
  components: Pick<AppComponents, 'db'>
}

export async function validateSignedFetch(
  ctx: SingedFetchContext,
  opts?: { gameId?: string; body?: unknown; validateParcel?: boolean }
) {
  if (opts?.gameId) {
    await validateGameParcel(ctx, opts.gameId)
  }
  if (opts?.body) {
    await validateBody(ctx, opts.body)
  }

  // await validateUserInDCL(ctx, !!opts?.validateParcel)
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

  if (hostname?.includes('localhost') && process.env.NODE_ENV !== 'production') {
    return
  }

  if (!hostname || !userAddress || !parcel) {
    throw new InvalidRequestError('Invalid signtarue')
  }

  // We can't validate through worlds
  if (hostname.includes('worlds-content-server')) {
    throw new InvalidRequestError('Worlds is not supported')
  }

  if (ctx.verification?.authMetadata.realm.serverName === 'main') {
    hostname = 'https://archipelago-ea-stats.decentraland.org'
  }

  let data: PeerResponse
  try {
    data = (await (await fetch(hostname + '/comms/peers')).json()) as PeerResponse
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
