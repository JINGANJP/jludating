export interface UserProfile {
  id: string
  email: string
  status: string
  isVerified: boolean
  profileCompletion?: number
  profile?: {
    nickname?: string
    grade?: string
    major?: string
    department?: string
    avatarUrl?: string
    profileCompletion: number
  }
}
