export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresIn: string
  user: {
    id: string
    email: string
    status: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  code: string
  password: string
}
