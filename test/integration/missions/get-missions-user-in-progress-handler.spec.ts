import { after } from 'node:test'
import { Mission, Game, Challenge, MissionType } from '../../../src/types'
import { test } from '../../components'
import { VALID_CAMPAIGN_KEY } from '../../mocks/send-reward-mock'
import { makeRequest } from '../../utils'

test('GET /api/missions/in_progress', ({ components }) => {
  let mission1: Mission, mission2: Mission, mission3: Mission
  let game1: Game, game2: Game
  let challenge1: Challenge, challenge2: Challenge

  beforeAll(async () => {
    const { db } = components
    mission1 = await db.createMission('TEST Mission User 1', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES)
    mission2 = await db.createMission('TEST Mission User 2', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES)
    mission3 = await db.createMission('TEST Mission User 3', VALID_CAMPAIGN_KEY, MissionType.MINI_GAMES)

    await db.deactivateMission(mission3.id)

    game1 = await db.createGame('TEST Mission User', '10,10')
    game2 = await db.createGame('TEST Mission User1', '10,10')

    const { id: gameId } = game1
    const { id: gameId2 } = game2

    challenge1 = await db.createGameChallenge({
      gameId,
      description: 'TEST Mission User 4',
      targetLevel: 4,
      missionId: mission1.id
    })
    await db.setMissionAsStart('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', mission1.id)
    await db.setChallengeAsComplete('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', challenge1.id)

    const userMission = await db.getUserMissions('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', {
      missionId: mission1.id,
      active: true
    })
    await db.setMissionAsEnd(userMission[0].id)

    challenge2 = await db.createGameChallenge({
      gameId: gameId2,
      description: 'TEST Mission User 5',
      targetLevel: 5,
      missionId: mission2.id
    })

    await db.setMissionAsStart('0x7949f9f239d1a0816ce5eb364a1f588ae9cc1bf5', mission2.id)
  })

  afterAll(async () => {
    const { db } = components
    db.deleteChallenges([challenge1, challenge2].map(({ id }) => id))
    db.deleteGames([game1, game2].map(({ id }) => id))
    db.deleteMissions([mission1, mission2, mission3].map(({ id }) => id))
  })

  it('should return 200 with missions in progress for the user', async () => {
    const { localFetch } = components

    const response = await makeRequest(localFetch, `/api/missions/in_progress?type=${MissionType.MINI_GAMES}`)

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.data.missions.length).toBeGreaterThan(0)
    expect(json.data.missions[0].id).toBe(mission2.id)
    expect(json.data.missions.every(({ id }) => id === mission3.id)).toBe(false)
  })

  it('should return 400 when no auth', async () => {
    const { localFetch } = components

    const response = await localFetch.fetch(`/api/missions/in_progress?type=${MissionType.MINI_GAMES}`)

    expect(response.status).toBe(400)
  })
})
