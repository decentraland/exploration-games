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
import { Rarity, EmoteCategory, WearableCategory } from '@dcl/schemas'

export type GlobalContext = {
  components: BaseComponents
}

export type IMissionChecker = IBaseComponent

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
  missionChecker: IMissionChecker
}

// components used in runtime
export type AppComponents = BaseComponents & {
  statusChecks: IBaseComponent
}

// components used in tests
export type TestComponents = BaseComponents & {
  // A fetch component that only hits the test server
  localFetch: IFetchComponent
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
  DecentralandSignatureContext<DecentralandSignatureMetadata>

export type DecentralandSignatureMetadata = {
  origin: string
  sceneId: string
  parcel: string
  tld: string
  network: string
  signer: string
  isGuest: boolean
  realm: {
    hostname: string
    protocol: string
    serverName: string
  }
  hashPayload?: string
}

export type CreateChallengePayload = {
  missionId: string
  description: string
  targetLevel: number
  data?: Record<string, any>
  gameId: string
}

export type CreateGamePayload = {
  name: string
  x: number
  y: number
}

export type Game = {
  id: string
  name: string
  parcel: string
  active: boolean
}

export type Mission = {
  id: string
  description: string
  campaign_key: string
  type: MissionType
  active: boolean
  thumb_url: string
}

export enum MissionType {
  MINI_GAMES = 'mini-games',
  FASHION_WEEK = 'fw-2025'
}

export type MissionInProgress = Mission & {
  start_time: string
}

export type MissionCompleted = Mission & {
  start_time: string
  end_time: string
}

export type GameMetrics = {
  score?: number
  level?: number
  time?: number
  moves?: number
}

export type NewProgressInGamePayload = GameMetrics & {
  user_name: string
  data?: Record<string, any>
}

export type IScore = GameMetrics & {
  data?: Record<string, any>
}

export type ValidCondition = '=' | '>' | '<' | '>=' | '<='
export type ScoreKeys = keyof IScore
export type CustomDataKeys = keyof { [key: string]: number }

export type UserProgress = GameMetrics & {
  id: string
  game_id: string
  user_address: string
  user_name: string
  data: Record<string, any>
  updated_at: string
}

export type Challenge = {
  id: string
  description: string
  game_id: string
  mission_id: string
  target_level: number
  data: IChallengeData
  active: boolean
}

export type IChallengeData = {
  [key in ScoreKeys]: {
    customDataType?: CustomDataKeys
    condition: ValidCondition
    target: number
  }
}

export type ChallengeWithCompletionTime = Challenge & {
  completed: boolean
  completed_at: string
}

export type UserChallenge = {
  id: string
  user_address: string
  challenge_id: string
  challenge_uncompleted: boolean
}

export type GamePlayedByUser = GameMetrics & {
  name: string
  parcel: string
  data: Record<string, any>
}

export type Leaderboard = GameMetrics & {
  name: string
  parcel: string
  user_address: string
  data: Record<string, any>
}

export type UserMission = {
  id: string
  user_address: string
  mission_id: string
  start_time: string
  end_time: string | null
  active: boolean
}

export enum ProgressSort {
  SCORE = 'score',
  LATEST = 'updated_at',
  LEVEL = 'level',
  MOVES = 'moves',
  TIME = 'time'
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
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

  rarity?: Rarity | null
  category?: WearableCategory | EmoteCategory | null

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
