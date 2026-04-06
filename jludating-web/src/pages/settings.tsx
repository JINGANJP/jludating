import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronRight, LogOut, Shield, Smartphone, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { userApi } from '@/api/user'
import { useAuthStore } from '@/stores/use-auth-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const sections = [
  {
    title: '账号信息',
    icon: User,
    items: [
      { label: '邮箱', type: 'info' as const },
      { label: '个人资料', desc: '修改昵称、年级、院系等', href: '/profile' },
    ],
  },
  {
    title: '隐私与安全',
    icon: Shield,
    items: [
      { label: '修改密码', desc: '定期更换密码保障账号安全', href: '#' },
      { label: '隐私设置', desc: '控制资料的可见范围', href: '#' },
    ],
  },
  {
    title: '通知设置',
    icon: Bell,
    items: [
      { label: '匹配结果通知', desc: '收到匹配结果时邮件提醒', href: '#' },
    ],
  },
  {
    title: '设备',
    icon: Smartphone,
    items: [
      { label: '当前登录设备', desc: 'Web 浏览器', href: '#' },
    ],
  },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const session = useAuthStore((s) => s.session)

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: userApi.getMe,
  })

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
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">设置</h1>
        <p className="mt-1 text-sm text-text-secondary">管理你的账号和偏好</p>
      </div>

      {/* 用户头像区 */}
      <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white ring-2 ring-primary/20">
            {avatarLetter}
          </div>
          <div>
            <p className="font-semibold text-text-primary text-base">
              {me?.profile?.nickname || emailHandle}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">{session?.user.email}</p>
            <span className="inline-block mt-1.5 text-xs text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-0.5 border border-emerald-100">
              ✓ 邮箱已验证
            </span>
          </div>
        </div>
      </div>

      {/* 设置项 */}
      {sections.map(({ title, icon: Icon, items }) => (
        <div key={title} className="rounded-2xl border border-border/50 bg-background shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
            <Icon className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          </div>
          <div className="divide-y divide-border/30">
            {items.map((item) => (
              item.type === 'info' ? (
                <div key={item.label} className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="text-sm font-medium text-text-primary">{session?.user.email}</span>
                </div>
              ) : (
                <button
                  key={item.label}
                  onClick={() => item.href !== '#' ? navigate(item.href!) : undefined}
                  className={cn(
                    'flex w-full items-center justify-between px-5 py-4 text-left transition-colors',
                    item.href !== '#' ? 'hover:bg-surface cursor-pointer' : 'cursor-default opacity-60'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    {'desc' in item && item.desc && (
                      <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
                </button>
              )
            ))}
          </div>
        </div>
      ))}

      {/* 登出 */}
      <div className="rounded-2xl border border-red-100 bg-background shadow-sm overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="w-full justify-start gap-3 px-5 py-4 h-auto text-red-500 hover:bg-red-50 hover:text-red-600 rounded-none font-medium"
        >
          <LogOut className="h-4 w-4" />
          {logout.isPending ? '退出中…' : '退出登录'}
        </Button>
      </div>

      <p className="text-center text-xs text-text-muted pb-2">
        JLUDating v1.0 · 仅供校内同学使用 · 数据加密保存
      </p>
    </div>
  )
}
