import { apiClient } from './client'

export interface ProfileData {
  nickname: string
  avatarUrl: string
  bio: string
  gender: 'MALE' | 'FEMALE' | 'UNDISCLOSED' | null
  grade: string
  major: string
  department: string
  mbti: string
  tags: string[]
  hometown?: string
  highlightedQuote?: string
  profileCompletion: number
  email?: string
}

export const profileApi = {
  get: async (): Promise<ProfileData> => {
    const { data } = await apiClient.get<ProfileData>('/users/profile')
    return data
  },
  update: async (payload: Partial<ProfileData>): Promise<{ success: boolean }> => {
    const { data } = await apiClient.put('/users/profile', payload)
    return data
  },
}
