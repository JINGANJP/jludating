import { apiClient } from './client'
import type { UserProfile } from '@/types/user'

export const userApi = {
  getMe: async () => {
    const { data } = await apiClient.get<UserProfile>('/users/me')
    return data
  },
}
