import { createBrowserRouter, redirect } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { AdminPage } from '@/pages/admin'
import { HistoryPage } from '@/pages/history'
import { LandingPage } from '@/pages/landing'
import { LoginPage } from '@/pages/login'
import { MatchLobbyPage } from '@/pages/match-lobby'
import { MatchResultPage } from '@/pages/match-result'
import { NotFoundPage } from '@/pages/not-found'
import { ProfilePage } from '@/pages/profile'
import { QuestionnairePage } from '@/pages/questionnaire'
import { RegisterPage } from '@/pages/register'
import { SettingsPage } from '@/pages/settings'
import { getCachedSession } from '@/api/auth'

/** 路由守卫 loader：未登录则重定向到登录页 */
function requireAuth() {
  const session = getCachedSession()
  if (!session?.accessToken) {
    throw redirect('/login')
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'profile',
        element: <ProfilePage />,
        loader: () => { requireAuth(); return null },
      },
      {
        path: 'questionnaire',
        element: <QuestionnairePage />,
        loader: () => { requireAuth(); return null },
      },
      {
        path: 'match',
        element: <MatchLobbyPage />,
        loader: () => { requireAuth(); return null },
      },
      {
        path: 'match/result',
        element: <MatchResultPage />,
        loader: () => { requireAuth(); return null },
      },
      {
        path: 'history',
        element: <HistoryPage />,
        loader: () => { requireAuth(); return null },
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        loader: () => { requireAuth(); return null },
      },
      {
        path: 'admin',
        element: <AdminPage />,
        loader: () => { requireAuth(); return null },
      },
    ],
  },
])
