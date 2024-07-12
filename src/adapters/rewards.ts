import { BaseComponents, IRewardComponent } from '../types'

export function createRewardComponent(components: Pick<BaseComponents, 'fetcher' | 'config'>): IRewardComponent {
  const { fetcher, config } = components

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

    if (response.ok) {
      return await response.json()
    }

    throw new Error(`Failed to fetch ${url}: ${response.status} ${await response.text()}`)
  }

  async function sendReward(campaignKey: string, beneficiary: string) {
    const rewardUrl = new URL(await config.requireString('REWARD_SERVER_URL'))
    return fetchJson(rewardUrl, 'rewards', { campaignKey, beneficiary })
  }

  return {
    sendReward
  }
}
