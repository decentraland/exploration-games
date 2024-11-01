import { InvalidRequestError } from '@dcl/platform-server-commons'
import { ContextWithAuth } from '../../types'
import { createHash } from 'crypto'

export async function validateSignedFetch(ctx: ContextWithAuth, opts?: { gameId?: string; body?: unknown }) {
  if (opts?.gameId) {
    await validateGameParcel(ctx, opts.gameId)
  }
  if (opts?.body) {
    await validateBody(ctx, opts.body)
  }

  await validateUserInDCL(ctx)
}

export async function validateGameParcel(ctx: ContextWithAuth, gameId: string) {
  const { components } = ctx
  // Validate same parcel
  const game = await components.db.getGame(gameId)

  if (game.parcel !== ctx.verification?.authMetadata.parcel) {
    throw new InvalidRequestError('Invalid request')
  }
}

function hashSha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export async function validateBody(ctx: ContextWithAuth, body: unknown) {
  // Validate same parcel
  if (ctx.verification?.authMetadata.hashPayload) {
    if (hashSha256(JSON.stringify(body)) !== ctx.verification.authMetadata.hashPayload) {
      throw new InvalidRequestError('Invalid body')
    }
  }
}

export async function validateUserInDCL(ctx: ContextWithAuth) {
  const userAddress = ctx.verification?.auth
  const parcel = ctx.verification?.authMetadata.parcel
  let hostname = ctx.verification?.authMetadata.realm.hostname

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
  const parcelNumber = parcel.split(',').map((item: string) => parseInt(item, 10))

  if (!data.ok || !player || player.parcel[0] !== parcelNumber[0] || player.parcel[1] !== parcelNumber[1]) {
    throw new InvalidRequestError('Player outside Scene')
  }
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
