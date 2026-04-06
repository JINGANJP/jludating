import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Eye, EyeOff, Heart, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/use-auth-store'
import { cn } from '@/lib/utils'

const step1Schema = z.object({
  email: z.string().email('请输入有效邮箱地址'),
  code: z.string().length(6, '验证码为 6 位'),
})

const step2Schema = z.object({
  password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/[A-Za-z]/, '需包含字母')
    .regex(/\d/, '需包含数字'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>

export function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeHint, setCodeHint] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const sendCode = useMutation({
    mutationFn: authApi.sendCode,
    onSuccess: ({ message }) => {
      setCodeHint({ type: 'success', msg: message })
      startCountdown()
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      setCodeHint({ type: 'error', msg: e.response?.data?.message ?? '发送失败，请检查邮箱' })
    },
  })

  const verifyCode = useMutation({
    mutationFn: () => authApi.verifyCode(email, code),
    onSuccess: () => setStep(2),
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      setCodeHint({ type: 'error', msg: e.response?.data?.message ?? '验证码错误，请重试' })
    },
  })

  const registerMutation = useMutation({
    mutationFn: (password: string) => authApi.register({ email, code, password }),
    onSuccess: (session) => {
      setSession(session)
      navigate('/')
    },
    onError: (err) => {
      const e = err as { response?: { data?: { message?: string } } }
      setCodeHint({ type: 'error', msg: e.response?.data?.message ?? '注册失败，请稍后重试' })
    },
  })

  const step1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) })
  const step2 = useForm<Step2Values>({ resolver: zodResolver(step2Schema) })

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative overflow-hidden items-end">
        <img
          src="https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=900&q=85&auto=format&fit=crop"
          alt="秋日校园"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-primary/40 to-secondary/40" />
        <div className="relative z-10 p-12 pb-14">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Heart className="h-6 w-6 fill-white text-white" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-white leading-snug">
            开启你的<br />
            <span className="italic">认真</span>相遇之旅
          </h2>
          <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs">
            使用吉林大学邮箱完成身份验证，
            参与每期限定名额的匹配活动。
          </p>

          {/* Steps preview */}
          <div className="mt-8 space-y-3">
            {[
              { icon: '✉️', text: '验证高校邮箱，确认身份' },
              { icon: '📝', text: '完成 42 题深度问卷' },
              { icon: '💕', text: '双向匹配，解锁联系方式' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <span className="text-sm text-white/80">{text}</span>
              </div>
            ))}
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
            <h1 className="font-display text-3xl font-semibold text-text-primary">创建账号</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {step === 1 ? '第一步：验证你的高校邮箱' : '第二步：设置登录密码'}
            </p>

            {/* Step progress */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  step >= 1 ? 'bg-primary text-white' : 'bg-border text-text-muted'
                )}>
                  {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                </div>
                <span className={cn('text-xs font-medium', step === 1 ? 'text-primary' : 'text-text-muted')}>
                  验证邮箱
                </span>
              </div>
              <div className="h-px w-10 bg-border" />
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  step >= 2 ? 'bg-primary text-white' : 'bg-border text-text-muted'
                )}>
                  2
                </div>
                <span className={cn('text-xs font-medium', step === 2 ? 'text-primary' : 'text-text-muted')}>
                  设置密码
                </span>
              </div>
            </div>
          </div>

          {/* Step 1 Form */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={step1.handleSubmit(() => verifyCode.mutate())}>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">高校邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-text-muted/60"
                    placeholder="yourname@mails.jlu.edu.cn"
                    autoComplete="email"
                    {...step1.register('email')}
                    onChange={(e) => {
                      step1.setValue('email', e.target.value)
                      setEmail(e.target.value)
                    }}
                  />
                </div>
                {step1.formState.errors.email && (
                  <p className="text-xs text-red-500">{step1.formState.errors.email.message}</p>
                )}
                <p className="text-xs text-text-muted">支持：mails.jlu.edu.cn · jlu.edu.cn</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">邮箱验证码</label>
                <div className="flex gap-2.5">
                  <input
                    className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 tracking-widest placeholder:tracking-normal placeholder:text-text-muted/60"
                    placeholder="6 位验证码"
                    maxLength={6}
                    {...step1.register('code')}
                    onChange={(e) => {
                      step1.setValue('code', e.target.value)
                      setCode(e.target.value)
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => sendCode.mutate(step1.getValues('email'))}
                    disabled={sendCode.isPending || countdown > 0}
                    className="shrink-0 h-11 px-4 text-sm rounded-xl"
                  >
                    {sendCode.isPending ? '发送中…' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Button>
                </div>
                {step1.formState.errors.code && (
                  <p className="text-xs text-red-500">{step1.formState.errors.code.message}</p>
                )}
              </div>

              {codeHint && (
                <div className={cn(
                  'flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm',
                  codeHint.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : 'bg-red-50 border border-red-100 text-red-700'
                )}>
                  <span className="mt-0.5 shrink-0">{codeHint.type === 'success' ? '✉️' : '⚠️'}</span>
                  {codeHint.msg}
                </div>
              )}

              <Button className="w-full h-11 font-medium rounded-xl mt-1" size="lg" type="submit" disabled={verifyCode.isPending}>
                {verifyCode.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    验证中…
                  </span>
                ) : '验证邮箱，继续注册 →'}
              </Button>
            </form>
          )}

          {/* Step 2 Form */}
          {step === 2 && (
            <form
              className="space-y-4"
              onSubmit={step2.handleSubmit(({ password }) => registerMutation.mutate(password))}
            >
              <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">
                  邮箱 <span className="font-medium">{email}</span> 验证通过
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">设置密码</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-11 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-text-muted/60"
                    placeholder="至少 8 位，需含字母和数字"
                    autoComplete="new-password"
                    {...step2.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {step2.formState.errors.password && (
                  <p className="text-xs text-red-500">{step2.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">确认密码</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-11 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-text-muted/60"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    {...step2.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {step2.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500">{step2.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {registerMutation.isError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <span className="text-sm text-red-700">
                    {(registerMutation.error as any)?.response?.data?.message ?? '注册失败，请稍后重试'}
                  </span>
                </div>
              )}

              <Button className="w-full h-11 font-medium rounded-xl mt-1" size="lg" type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    创建中…
                  </span>
                ) : '完成注册 →'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-text-secondary">
            已有账号？{' '}
            <Link to="/login" className="font-medium text-primary hover:underline underline-offset-2">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
