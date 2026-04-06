import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, ChevronRight, Heart, Loader2, Play, Plus, RefreshCw, Shield, Users } from 'lucide-react'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ─── API ─────────────────────────────────────────────────────────────────────

async function getDashboard() {
  const { data } = await apiClient.get<{
    registrationsThisWeek: number
    participantCount: number
    matchRate: number
  }>('/admin/dashboard')
  return data
}

async function getCurrentRound() {
  const { data } = await apiClient.get<{
    roundNumber: number
    status: string
    participantCount: number
    startsAt: string | null
    endsAt: string | null
  }>('/matching/current-round')
  return data
}

async function runMatching() {
  const { data } = await apiClient.post<{
    success: boolean
    message: string
    stats: {
      participants: number
      pairs: number
      unmatched: number
      avgScore: number
      minScore: number
      maxScore: number
    }
  }>('/matching/run', {})
  return data
}

async function createNewRound() {
  const { data } = await apiClient.post<{
    success: boolean
    message: string
    roundNumber?: number
  }>('/admin/rounds/create', {})
  return data
}

async function getWhitelist() {
  const { data } = await apiClient.get<Array<{
    domain: string
    university: string
    active: boolean
  }>>('/admin/whitelist')
  return data
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-primary',
  bg = 'bg-primary/8',
  desc,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: string
  bg?: string
  desc?: string
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
          {desc && <p className="mt-1 text-xs text-text-muted">{desc}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', bg)}>
          <Icon className={cn('h-5 w-5', accent)} />
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [matchResult, setMatchResult] = useState<{
    success: boolean
    message: string
    stats?: {
      participants: number
      pairs: number
      unmatched: number
      avgScore: number
      minScore: number
      maxScore: number
    }
  } | null>(null)

  const dashboard = useQuery({ queryKey: ['admin-dashboard'], queryFn: getDashboard })
  const round = useQuery({ queryKey: ['current-round'], queryFn: getCurrentRound })
  const whitelist = useQuery({ queryKey: ['admin-whitelist'], queryFn: getWhitelist })

  const runMatchMutation = useMutation({
    mutationFn: runMatching,
    onSuccess: (res) => {
      setMatchResult(res)
      qc.invalidateQueries({ queryKey: ['current-round'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      if (res.success) {
        toast({ title: '✅ 匹配执行成功', description: res.message })
      } else {
        toast({ title: '匹配未完成', description: res.message, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: '执行失败', description: '请稍后重试', variant: 'destructive' }),
  })

  const createRoundMutation = useMutation({
    mutationFn: createNewRound,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['current-round'] })
      if (res.success) {
        toast({ title: '✅ 新一期已创建', description: res.message })
      } else {
        toast({ title: '创建失败', description: res.message, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: '创建失败', description: '请稍后重试', variant: 'destructive' }),
  })

  const isRoundOpen = round.data?.status === 'open'
  const isRoundRunning = round.data?.status === 'running'
  const noRound = !round.data?.roundNumber || round.data.roundNumber === 0

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-primary" />
            管理后台
          </h1>
          <p className="mt-1 text-sm text-text-secondary">JLUDating 运营控制台</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
            qc.invalidateQueries({ queryKey: ['current-round'] })
          }}
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          label="本周新注册"
          value={dashboard.data?.registrationsThisWeek ?? '—'}
          icon={Users}
          accent="text-primary"
          bg="bg-primary/8"
          desc="过去 7 天"
        />
        <StatCard
          label="本期报名人数"
          value={round.data?.participantCount ?? '—'}
          icon={Heart}
          accent="text-rose-500"
          bg="bg-rose-50"
          desc={round.data?.roundNumber ? `第 ${round.data.roundNumber} 期` : '无开放轮次'}
        />
        <StatCard
          label="历史匹配成功率"
          value={dashboard.data ? `${Math.round(dashboard.data.matchRate * 100)}%` : '—'}
          icon={CheckCircle2}
          accent="text-emerald-600"
          bg="bg-emerald-50"
          desc="双向接受率"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* 当前轮次控制 */}
        <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-text-primary text-base">轮次管理</h2>

          {/* 当前轮次状态 */}
          <div className="rounded-xl border border-border/40 bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">当前轮次</p>
              {round.isLoading ? (
                <span className="text-xs text-text-muted">加载中…</span>
              ) : noRound ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">无开放轮次</span>
              ) : (
                <span className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  isRoundOpen ? 'bg-emerald-100 text-emerald-700' :
                  isRoundRunning ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {isRoundOpen ? '🟢 报名中' : isRoundRunning ? '⚡ 匹配中' : round.data?.status ?? '—'}
                </span>
              )}
            </div>
            {!noRound && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-text-muted text-xs">期数</p>
                    <p className="font-medium text-text-primary">第 {round.data?.roundNumber} 期</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs">报名人数</p>
                    <p className="font-medium text-text-primary">{round.data?.participantCount} 人</p>
                  </div>
                  {round.data?.startsAt && (
                    <div>
                      <p className="text-text-muted text-xs">开始时间</p>
                      <p className="font-medium text-text-primary text-xs">
                        {new Date(round.data.startsAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  )}
                  {round.data?.endsAt && (
                    <div>
                      <p className="text-text-muted text-xs">截止时间</p>
                      <p className="font-medium text-text-primary text-xs">
                        {new Date(round.data.endsAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            {/* 执行匹配 */}
            <Button
              className="w-full h-11 font-medium rounded-xl gap-2"
              onClick={() => {
                setMatchResult(null)
                runMatchMutation.mutate()
              }}
              disabled={runMatchMutation.isPending || noRound || !isRoundOpen}
            >
              {runMatchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  匹配算法运行中…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  执行本期匹配
                </>
              )}
            </Button>
            {(noRound || !isRoundOpen) && !runMatchMutation.isPending && (
              <p className="text-xs text-center text-text-muted">
                {noRound ? '请先创建新一期轮次' : isRoundRunning ? '本期已执行匹配' : '当前无开放轮次'}
              </p>
            )}

            {/* 创建新轮次 */}
            <Button
              variant="outline"
              className="w-full h-11 font-medium rounded-xl gap-2"
              onClick={() => createRoundMutation.mutate()}
              disabled={createRoundMutation.isPending || isRoundOpen}
            >
              {createRoundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  创建中…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  创建新一期轮次
                </>
              )}
            </Button>
            {isRoundOpen && (
              <p className="text-xs text-center text-text-muted">当前已有开放轮次，无需创建新轮次</p>
            )}
          </div>
        </div>

        {/* 匹配结果 */}
        <div className="space-y-5">
          {/* 匹配执行结果 */}
          {matchResult && (
            <div className={cn(
              'rounded-2xl border p-5 space-y-4',
              matchResult.success ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            )}>
              <div className="flex items-center gap-2.5">
                {matchResult.success
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                }
                <div>
                  <p className={cn(
                    'text-sm font-semibold',
                    matchResult.success ? 'text-emerald-800' : 'text-amber-800'
                  )}>
                    {matchResult.success ? '匹配执行成功' : '匹配未能完成'}
                  </p>
                  <p className={cn(
                    'text-xs mt-0.5',
                    matchResult.success ? 'text-emerald-600' : 'text-amber-600'
                  )}>
                    {matchResult.message}
                  </p>
                </div>
              </div>

              {matchResult.success && matchResult.stats && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '参与人数', value: matchResult.stats.participants },
                    { label: '成功配对', value: matchResult.stats.pairs + ' 对' },
                    { label: '未匹配', value: matchResult.stats.unmatched },
                    { label: '平均相似度', value: matchResult.stats.avgScore + '%' },
                    { label: '最低分', value: matchResult.stats.minScore + '%' },
                    { label: '最高分', value: matchResult.stats.maxScore + '%' },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl bg-white/70 border border-emerald-100 p-2.5 text-center"
                    >
                      <p className="text-[10px] text-emerald-600">{label}</p>
                      <p className="text-sm font-bold text-emerald-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 白名单域名 */}
          <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
            <h3 className="font-semibold text-text-primary text-sm mb-4">邮箱白名单</h3>
            {whitelist.isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-10 rounded-xl bg-surface animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {whitelist.data?.map(({ domain, university, active }) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-surface px-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{university}</p>
                      <p className="text-xs text-text-muted">{domain}</p>
                    </div>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {active ? '已开放' : '已关闭'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 快速导航 */}
          <div className="rounded-2xl border border-border/50 bg-background p-5 shadow-sm">
            <h3 className="font-semibold text-text-primary text-sm mb-3">快速操作</h3>
            <div className="space-y-1">
              {[
                { label: '查看所有匹配结果', desc: '本期配对列表' },
                { label: '用户管理', desc: '查看注册用户列表' },
                { label: '数据导出', desc: '导出匹配数据报表' },
              ].map(({ label, desc }) => (
                <button
                  key={label}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface cursor-default opacity-60"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted text-center mt-3">更多功能敬请期待</p>
          </div>
        </div>
      </div>
    </div>
  )
}
