import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession } from '@/types/auth'

interface AuthState {
  session: AuthSession | null
  setSession: (session: AuthSession | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    {
      name: 'jludating-auth',
      // 只持久化 session，不持久化其他字段
      partialize: (state) => ({ session: state.session }),
    },
  ),
)
