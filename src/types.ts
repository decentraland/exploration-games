import type {
  IConfigComponent,
  ILoggerComponent,
  IHttpServerComponent,
  IBaseComponent,
  IMetricsComponent,
  IFetchComponent
} from '@well-known-components/interfaces'
import { IPgComponent } from '@well-known-components/pg-component'
import { metricDeclarations } from './metrics'
import { IDatabaseComponent } from './adapters/db'
import { DecentralandSignatureContext } from '@dcl/platform-crypto-middleware/dist/types'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'

export type GlobalContext = {
  components: BaseComponents
}

// components used in every environment
export type BaseComponents = {
  config: IConfigComponent
  logs: ILoggerComponent
  server: IHttpServerComponent<GlobalContext>
  metrics: IMetricsComponent<keyof typeof metricDeclarations>
  fetcher: IFetchComponent
  pg: IPgComponent
  db: IDatabaseComponent
  rewardService: IRewardComponent
}

// components used in runtime
export type AppComponents = BaseComponents & {
  statusChecks: IBaseComponent
}

// components used in tests
export type TestComponents = BaseComponents & {
  // A fetch component that only hits the test server
  localFetch: IFetchComponent
  rewardFetch: IRewardComponent
}

// this type simplifies the typings of http handlers
export type HandlerContextWithPath<
  ComponentNames extends keyof AppComponents,
  Path extends string = any
> = IHttpServerComponent.PathAwareContext<
  IHttpServerComponent.DefaultContext<{
    components: Pick<AppComponents, ComponentNames>
  }>,
  Path
> &
  DecentralandSignatureContext<any>

export type Context<Path extends string = any> = IHttpServerComponent.PathAwareContext<GlobalContext, Path>

export type ContextWithAuth<Path extends string = any> = IHttpServerComponent.PathAwareContext<GlobalContext, Path> &
  DecentralandSignatureContext<any>

export type Game = {
  id: string
  name: string
  parcel: string
  active: boolean
}

export type UserProgress = {
  id: string
  game_id: string
  user_address: string
  level: number
  score: number
  data: Record<string, any>
  updated_at: string
}

export type Challenge = {
  id: string
  description: string
  game_id: string
  target_level: number
  campaign_key: string
  active: boolean
}

export type GamePlayedByUser = {
  name: string
  parcel: string
  level: number
  score: number
  data: Record<string, any>
}

export enum progressOption {
  ALL = 'all',
  MAX = 'max',
  LAST = 'last'
}

export enum RewardL2Status {
  unassigned = 'unassigned',

  // assigned and waiting for a confirmation (example: blockchain confirmation)
  pending = 'pending',

  assigned = 'assigned',
  sending = 'sending',
  success = 'success',
  rejected = 'rejected',
  confirmed = 'confirmed'
}

export type RewardAttributes = {
  id: string
  user: string | null
  from_referral: string | null
  airdrop_type: string
  campaign_id: string
  campaign_key: string | null
  status: RewardL2Status
  chain_id: ChainId | 0
  target: string
  value: string
  token: string
  image: string | null

  /**
   * Assign attributes
   */
  group: string | null
  priority: number

  /**
   * Transaction status attributes
   */
  transaction_id: string | null
  transaction_hash: string | null

  /**
   * Date attributes
   */
  created_at: Date
  updated_at: Date
  assigned_at: Date | null
}

export type IRewardComponent = IBaseComponent & {
  sendReward(campaignKey: string, beneficiary: string): Promise<{ ok: boolean; data: RewardAttributes[]; code?: Error }>
}
