import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Heart, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/use-auth-store'

const schema = z.object({
  email: z.string().email('请输入有效邮箱地址'),
  password: z.string().min(8, '密码至少 8 位'),
})

type LoginValues = z.infer<typeof schema>

export function LoginPage() {
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session)
      navigate('/')
    },
  })

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative overflow-hidden bg-brand-gradient items-end">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&q=85&auto=format&fit=crop"
          alt="校园风光"
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-secondary/50" />
        <div className="relative z-10 p-12 pb-14">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Heart className="h-6 w-6 fill-white text-white" />
          </div>
          <blockquote className="font-display text-2xl italic leading-relaxed text-white/95">
            我们不相信缘分是随机的，
            <br />但我们相信，认真的人值得认真的相遇。
          </blockquote>
          <p className="mt-5 text-sm text-white/60">— JLUDating · 吉林大学校园交友</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['A', 'B', 'C', 'D'].map((l) => (
                <div
                  key={l}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-xs font-bold text-white ring-2 ring-white/20"
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/75">已有 <strong className="text-white">2,400+</strong> 位同学加入</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md lg:hidden">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-text-primary">欢迎回来</h1>
            <p className="mt-2 text-sm text-text-secondary">登录 JLUDating，继续本期的匹配之旅</p>
          </div>

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await login.mutateAsync(values)
            })}
          >
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">机构邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-text-muted/60"
                  placeholder="yourname@mails.jlu.edu.cn"
                  autoComplete="email"
                  {...form.register('email')}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">密码</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-11 text-sm outline-none transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-text-muted/60"
                  placeholder="输入密码"
                  autoComplete="current-password"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            {login.isError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <span className="mt-0.5 text-red-400 shrink-0 text-xs font-bold">✕</span>
                <p className="text-sm text-red-700">
                  {(login.error as any)?.response?.data?.message ?? '邮箱或密码错误，请重试'}
                </p>
              </div>
            )}

            <Button
              className="w-full h-11 font-medium rounded-xl mt-2"
              size="lg"
              type="submit"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  登录中…
                </span>
              ) : '登录'}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">或者</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-5 text-center text-sm text-text-secondary">
            还没有账号？{' '}
            <Link to="/register" className="font-medium text-primary hover:underline underline-offset-2">
              免费注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
