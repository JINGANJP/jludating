import { BookOpen, Heart, History, LayoutDashboard, LogOut, Settings, UserRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/use-auth-store'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'

const authedNavItems = [
  { to: '/', label: '首页', icon: Heart },
  { to: '/match', label: '匹配大厅', icon: LayoutDashboard },
  { to: '/questionnaire', label: '问卷', icon: BookOpen },
  { to: '/profile', label: '个人资料', icon: UserRound },
  { to: '/history', label: '历史', icon: History },
]

export function AppShell() {
  const session = useAuthStore((s) => s.session)
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setSession(null)
      navigate('/')
    },
  })

  const emailHandle = session?.user.email.split('@')[0] ?? ''
  const avatarLetter = emailHandle.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 h-14">
          {/* Logo */}
          <NavLink to="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-all group-hover:bg-primary/90 group-hover:shadow-md">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <div className="hidden sm:flex flex-col">
              <p className="font-display text-[15px] font-semibold leading-none tracking-wide text-text-primary">
                JLUDating
              </p>
              <p className="text-[10px] text-text-muted mt-0.5 leading-none tracking-wider">吉大交友匹配</p>
            </div>
          </NavLink>

          {/* Nav — only for authed users */}
          {session && (
            <nav className="hidden items-center gap-0.5 md:flex">
              {authedNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-primary/6 hover:text-text-primary',
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right actions */}
          {session ? (
            <div className="flex items-center gap-2">
              {/* Avatar pill */}
              <NavLink
                to="/settings"
                className="hidden items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1.5 hover:bg-primary/6 transition-colors sm:flex"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {avatarLetter}
                </div>
                <span className="text-sm text-text-secondary max-w-[120px] truncate">{emailHandle}</span>
              </NavLink>
              {/* Mobile avatar */}
              <NavLink
                to="/settings"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white sm:hidden"
              >
                {avatarLetter}
              </NavLink>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="gap-1.5 text-text-secondary hover:text-primary h-8 px-2.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-sm">登出</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="text-text-secondary text-sm h-9">
                <NavLink to="/login">登录</NavLink>
              </Button>
              <Button size="sm" asChild className="h-9 px-4 text-sm font-medium rounded-lg">
                <NavLink to="/register">免费注册</NavLink>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile bottom nav for authenticated users */}
      {session && (
        <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/50 bg-background/90 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-around px-2 py-2">
            {authedNavItems.slice(0, 4).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all',
                    isActive ? 'text-primary' : 'text-text-muted',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => logout.mutate()}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-text-muted transition-all active:text-primary"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-medium">登出</span>
            </button>
          </div>
        </nav>
      )}

      {/* Content */}
      <main className={cn(
        'mx-auto w-full max-w-6xl px-4 sm:px-6 flex-1',
        session ? 'py-8 pb-24 md:pb-8' : 'py-0',
      )}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={cn(
        'border-t border-border/50 py-6 text-center bg-background',
        session ? 'pb-20 md:pb-6' : 'py-8'
      )}>
        <div className="mx-auto max-w-6xl px-6">
          {!session && (
            <div className="mb-5 flex items-center justify-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
                <Heart className="h-3.5 w-3.5 fill-current" />
              </div>
              <span className="font-display text-sm font-semibold text-text-primary">JLUDating</span>
            </div>
          )}
          <p className="text-xs text-text-muted tracking-wide">
            © 2026 JLUDating · 吉林大学校园交友匹配平台 · 仅供校内同学使用
          </p>
          <div className="mt-2.5 flex items-center justify-center gap-5 text-xs text-text-muted">
            <span className="hover:text-text-secondary cursor-default transition-colors">隐私政策</span>
            <span className="text-border/60">·</span>
            <span className="hover:text-text-secondary cursor-default transition-colors">用户协议</span>
            <span className="text-border/60">·</span>
            <span className="hover:text-text-secondary cursor-default transition-colors">关于我们</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
