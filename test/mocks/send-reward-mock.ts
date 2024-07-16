import { RewardAttributes, RewardL2Status, IRewardComponent } from '../../src/types'

export const VALID_CAMPAIGN_KEY = '00000000-0000-0000-0000-000000000000'
export const NON_EXISTING_CAMPAIGN_KEY = '11111111-1111-1111-1111-000000000000'

const rewards: RewardAttributes[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    user: '0x0000000000000000000000000000000000000000',
    campaign_id: '00000000-0000-0000-0000-000000000000',
    campaign_key: VALID_CAMPAIGN_KEY,
    from_referral: null,
    status: RewardL2Status.pending,
    chain_id: 137,
    airdrop_type: 'CollectionV2IssueToken',
    target: '0x7434a847c5e1ff250db456c55f99d1612e93d6a3',
    value: '0',
    group: null,
    priority: 2144355453,
    transaction_id: null,
    transaction_hash: null,
    token: 'Polygon sunglasses',
    image:
      'https://peer.decentraland.zone/lambdas/collections/contents/urn:decentraland:mumbai:collections-v2:0x7434a847c5e1ff250db456c55f99d1612e93d6a3:0/thumbnail',
    assigned_at: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  }
]

export function createRewardFetchComponent(): IRewardComponent {
  const sendReward = async (campaignKey: string): Promise<{ ok: boolean; data: RewardAttributes[]; code?: Error }> => {
    const rewardSent = rewards.find((reward) => reward.campaign_key === campaignKey)
    return {
      ok: true,
      data: rewardSent ? [rewardSent] : []
    }
  }
  return {
    sendReward
  }
}
