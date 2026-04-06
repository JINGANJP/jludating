import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle, ChevronDown, Heart, LayoutDashboard, LogIn, Sparkles, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CAMPUS_IMAGES } from '@/lib/campus-images'
import { useAuthStore } from '@/stores/use-auth-store'
import { Button } from '@/components/ui/button'

// ─── Carousel ────────────────────────────────────────────────────────────────

function CampusCarousel() {
  const [current, setCurrent] = useState(0)
  const [fade, setFade] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const startTimer = () => {
    timerRef.current = setTimeout(() => {
      setFade(false)
      setTimeout(() => {
        setCurrent((c) => (c + 1) % CAMPUS_IMAGES.length)
        setFade(true)
        startTimer()
      }, 800)
    }, 5500)
  }

  useEffect(() => {
    startTimer()
    return () => clearTimeout(timerRef.current)
  }, [])

  const goTo = (i: number) => {
    clearTimeout(timerRef.current)
    setFade(false)
    setTimeout(() => {
      setCurrent(i)
      setFade(true)
      startTimer()
    }, 500)
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {CAMPUS_IMAGES.map((img, i) => (
        <div
          key={img.url}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000',
            i === current && fade ? 'opacity-100' : 'opacity-0',
          )}
        >
          <img
            src={img.url}
            alt={img.alt}
            className="h-full w-full object-cover scale-[1.02] transition-transform duration-[8000ms]"
            style={{ transform: i === current && fade ? 'scale(1.0)' : 'scale(1.02)' }}
          />
          {/* 渐变叠加层 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/65" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
        </div>
      ))}

      {/* 图片说明 */}
      <div
        className={cn(
          'absolute bottom-16 right-10 text-right transition-opacity duration-700 hidden md:block',
          fade ? 'opacity-100' : 'opacity-0',
        )}
      >
        <p className="text-xs font-light text-white/60 tracking-[0.2em] uppercase">
          {CAMPUS_IMAGES[current].caption}
        </p>
      </div>

      {/* 指示点 */}
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2 z-10">
        {CAMPUS_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'rounded-full transition-all duration-400 hover:opacity-100',
              i === current
                ? 'w-7 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70',
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Stats 统计 ────────────────────────────────────────────────────────────

const stats = [
  { label: '注册同学', value: '2,400+' },
  { label: '成功配对', value: '680+' },
  { label: '覆盖高校', value: '8 所' },
]

// ─── Features ─────────────────────────────────────────────────────────────

const features = [
  {
    title: '校邮验证，真人保证',
    description: '仅限长春各大高校在校生参与，使用学校邮箱验证身份，身份可信，氛围纯净安全。',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    title: '42 题问卷，深度了解',
    description: '涵盖作息、价值观、恋爱观等 9 大维度，算法精准匹配，找到真正契合的 Ta。',
    icon: Sparkles,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    title: '双向确认，隐私安全',
    description: '双方都接受匹配后，才互换联系方式。尊重边界，让每次相遇都是从容的选择。',
    icon: Heart,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/10',
  },
]

// ─── How it works ─────────────────────────────────────────────────────────

const steps = [
  { step: '01', title: '注册账号', desc: '使用所在高校邮箱验证身份，保障安全可信' },
  { step: '02', title: '完善资料', desc: '填写基本信息，让对方更了解真实的你' },
  { step: '03', title: '完成问卷', desc: '42 道题，深入探索自我与匹配偏好' },
  { step: '04', title: '等待匹配', desc: '每期结束后揭晓匹配结果，双向确认' },
]

// ─── Guest Landing ────────────────────────────────────────────────────────────

function GuestLanding() {
  const scrollToContent = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen -mt-[57px]">
      {/* Hero Section */}
      <div className="relative h-screen min-h-[640px]">
        <CampusCarousel />

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {/* 徽章 */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 backdrop-blur-md shadow-sm">
            <Heart className="h-3.5 w-3.5 fill-rose-300 text-rose-300" />
            <span className="text-sm font-medium text-white/90 tracking-wide">
              2026 春季学期 · 第 2 期报名进行中
            </span>
          </div>

          {/* 主标题 */}
          <h1 className="font-display text-5xl font-semibold leading-[1.15] text-white md:text-6xl lg:text-7xl drop-shadow-sm max-w-3xl">
            在长春，<br />
            遇见<span className="italic text-rose-200">认真</span>的爱情
          </h1>

          {/* 副标题 */}
          <p className="mx-auto mt-7 max-w-xl text-[1.05rem] leading-relaxed text-white/80 md:text-lg">
            以问卷为媒，以算法为桥，为长春各大高校的年轻人，
            <br className="hidden md:block" />搭一个克制而真诚的相遇空间。
          </p>

          {/* 统计数字 */}
          <div className="mt-9 flex items-center gap-8">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-display text-2xl font-semibold text-white">{value}</p>
                <p className="mt-0.5 text-xs text-white/60 tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          {/* CTA 按钮 */}
          <div className="mt-10 flex flex-col items-center gap-3.5 sm:flex-row">
            <Button
              size="lg"
              className="h-13 px-8 shadow-lg bg-white text-primary hover:bg-white/95 hover:text-primary font-medium rounded-xl border-0 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
              asChild
            >
              <Link to="/register">
                立即报名本期匹配
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-7 border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/55 rounded-xl font-medium"
              asChild
            >
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                已有账号 · 登录
              </Link>
            </Button>
          </div>
        </div>

        {/* 向下滚动提示 */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors duration-200 group"
        >
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 bg-background py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary/70">How It Works</p>
            <h2 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
              如何参与
            </h2>
            <p className="mt-3 text-text-secondary">四步，开启你的匹配之旅</p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map(({ step, title, desc }, idx) => (
              <div key={step} className="group relative text-center">
                {/* 连接线 */}
                {idx < steps.length - 1 && (
                  <div className="absolute top-7 left-[calc(50%+28px)] right-[-50%+28px] hidden h-px bg-gradient-to-r from-border to-transparent md:block" />
                )}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 font-display text-2xl font-semibold text-primary ring-1 ring-primary/15 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:ring-primary/30 group-hover:shadow-lg">
                  {step}
                </div>
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 bg-surface py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary/70">Why Us</p>
            <h2 className="font-display text-3xl font-semibold text-text-primary md:text-4xl">
              为什么选择 JLUDating
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ title, description, icon: Icon, color, bg, border }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border/50 bg-background p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-default"
              >
                <div className={cn('mb-5 flex h-12 w-12 items-center justify-center rounded-xl', bg, border, 'border')}>
                  <Icon className={cn('h-6 w-6', color)} />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-text-primary">{title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Quote */}
      <section className="relative z-10 overflow-hidden bg-background py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="font-display text-6xl text-primary/15 leading-none mb-4">"</div>
          <blockquote className="font-display text-xl italic text-text-primary leading-relaxed md:text-2xl">
            我们不相信缘分是随机的，
            <br />
            但我们相信，认真的人值得认真的相遇。
          </blockquote>
          <p className="mt-6 text-sm text-text-muted">— JLUDating 团队</p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 bg-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-12 text-center md:p-16">
            {/* 装饰圆 */}
            <div className="deco-circle -top-16 -left-16 h-72 w-72 opacity-25" />
            <div className="deco-circle -bottom-12 -right-12 h-56 w-56 opacity-20" />
            <div className="relative z-10">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-white/60">Join Now</p>
              <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">
                本期报名已开放
              </h2>
          <p className="mx-auto mt-4 max-w-md text-white/75">
              已有 <span className="font-semibold text-white">2,400+</span> 位长春同学报名，与你的 Ta 就在其中
            </p>
              <Button
                size="lg"
                className="mt-9 h-12 px-8 bg-white text-primary shadow-lg hover:bg-white/92 hover:text-primary font-medium rounded-xl"
                asChild
              >
                <Link to="/register">
                  创建账号，开始匹配
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="bg-surface pb-4" />
    </div>
  )
}

// ─── Authenticated Dashboard ─────────────────────────────────────────────────

function AuthDashboard() {
  const session = useAuthStore((s) => s.session)

  const quickActions = [
    {
      to: '/match',
      icon: Heart,
      label: '匹配大厅',
      sub: '报名本期匹配，发现心动',
      accent: 'bg-primary/8 hover:bg-primary/12',
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      to: '/profile',
      icon: UserRound,
      label: '个人资料',
      sub: '完善资料，提升匹配质量',
      accent: 'bg-amber-50 hover:bg-amber-100/60',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      to: '/questionnaire',
      icon: Sparkles,
      label: '完成问卷',
      sub: '42 道题，了解真实的自己',
      accent: 'bg-violet-50 hover:bg-violet-100/60',
      iconBg: 'bg-violet-100 text-violet-600',
    },
  ]

  const emailHandle = session?.user.email.split('@')[0] ?? '同学'

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-8 py-12 text-center md:px-14 md:py-14">
        <div className="deco-circle -top-10 -left-10 h-60 w-60 opacity-30" />
        <div className="deco-circle -bottom-10 -right-10 h-48 w-48 opacity-20" />
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
            <Heart className="h-7 w-7 fill-white text-white" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
            欢迎回来，{emailHandle} ✨
          </h1>
          <p className="mx-auto mt-3 max-w-md text-white/75 text-sm md:text-base">
            完善资料 + 完成问卷，匹配成功率大幅提升！
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-5 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-sm font-medium text-white/90">
              2026 春季学期 · 第 2 期 · 报名进行中
            </span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">快速开始</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map(({ to, icon: Icon, label, sub, accent, iconBg }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'group flex items-center gap-4 rounded-2xl border border-border/50 p-5 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5',
                accent,
              )}
            >
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary text-sm group-hover:text-primary transition-colors">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* Match lobby preview */}
      <section className="mt-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface p-7 shadow-sm">
          <div className="deco-circle -top-6 -right-6 h-36 w-36 opacity-20" />
          <div className="relative flex flex-col items-center text-center md:flex-row md:text-left md:items-start md:gap-7">
            <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-text-primary">
                匹配大厅
              </h3>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                查看本期匹配状态，报名成功后等待结果揭晓，双方确认后解锁联系方式。
              </p>
            </div>
            <Button className="mt-4 shrink-0 md:mt-0" asChild>
              <Link to="/match">
                进入大厅
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function LandingPage() {
  const session = useAuthStore((s) => s.session)

  if (session) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <AuthDashboard />
      </div>
    )
  }

  return <GuestLanding />
}
