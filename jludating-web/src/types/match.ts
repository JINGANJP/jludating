export interface MatchingRound {
  roundNumber: number
  status: 'open' | 'running' | 'closed'
  participantCount: number
  startsAt: string
  endsAt: string
}

export interface MatchSummary {
  nickname: string
  major: string
  bio: string
  tags: string[]
  acceptanceStatus: 'pending' | 'accepted' | 'declined'
}
