import { apiClient } from './client'
import type { MatchingRound } from '@/types/match'

export interface JoinResult {
  success: boolean
  message?: string
}

export interface MatchDetail {
  matched: boolean
  message?: string
  nickname?: string
  major?: string
  bio?: string
  avatarUrl?: string
  tags?: string[]
  status?: string
  accepted?: boolean
}

export const matchingApi = {
  getCurrentRound: async () => {
    const { data } = await apiClient.get<MatchingRound>('/matching/current-round')
    return data
  },
  join: async (): Promise<JoinResult> => {
    const { data } = await apiClient.post<JoinResult>('/matching/join', {})
    return data
  },
  getCurrentResult: async () => {
    const { data } = await apiClient.get<MatchDetail>('/matching/result')
    return data
  },
  accept: async (): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post('/matching/accept', {})
    return data
  },
  decline: async (): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post('/matching/decline', {})
    return data
  },
}
