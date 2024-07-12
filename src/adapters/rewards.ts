import { IBaseComponent } from '@well-known-components/interfaces'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { BaseComponents } from '../types'

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

export function createRewardComponent(
  components: Pick<BaseComponents, 'fetcher' | 'logs' | 'config'>
): IRewardComponent {
  const { fetcher, logs, config } = components

  const logger = logs.getLogger('reward-component')
  const fetchJson = async (baseURL: URL, path: string, body = {}) => {
    let url = baseURL.toString()
    if (!url.endsWith('/')) {
      url += '/'
    }
    url += path
    const response = await fetcher.fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    })
    return response.json()
  }

  async function sendReward(campaignKey: string, beneficiary: string) {
    try {
      const rewardUrl = new URL(await config.requireString('REWARD_SERVER_URL'))
      return fetchJson(rewardUrl, 'rewards', { campaignKey, beneficiary })
    } catch (err: any) {
      logger.error(err)
    }
  }

  return {
    sendReward
  }
}
