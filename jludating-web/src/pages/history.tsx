import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Heart, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HistoryItem {
  roundNumber: number
  otherUser: { id: string; nickname: string; avatarUrl?: string }
  status: string
  myDecision: boolean | null
  createdAt: string
}

async function getHistory(): Promise<HistoryItem[]> {
  const { data } = await apiClient.get<HistoryItem[]>('/users/history')
  return data
}

function StatusBadge({ status, myDecision }: { status: string; myDecision: boolean | null }) {
  if (status === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> 双向互选
      </span>
    )
  }
  if (status === 'DECLINED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        <XCircle className="h-3 w-3" /> 已拒绝
      </span>
    )
  }
  if (myDecision === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
        等待确认
      </span>
    )
  }
  if (myDecision === true) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        我已接受
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
      待处理
    </span>
  )
}

export function HistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['match-history'],
    queryFn: getHistory,
    retry: false,
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">匹配历史</h1>
        <p className="mt-1 text-sm text-text-secondary">你的所有历史匹配记录</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse border border-border/30" />
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-background p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/8">
            <Heart className="h-6 w-6 text-primary/60" />
          </div>
          <h3 className="font-semibold text-text-primary">暂无匹配记录</h3>
          <p className="mt-2 text-sm text-text-secondary">报名参与本期匹配，开始你的缘分之旅</p>
          <Button className="mt-5 rounded-xl" asChild>
            <Link to="/match">
              前往匹配大厅
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const avatarLetter = item.otherUser.nickname?.charAt(0).toUpperCase() ?? '?'
            return (
              <div
                key={`${item.roundNumber}-${item.otherUser.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background p-5 shadow-sm"
              >
                {/* 头像 */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {avatarLetter}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary text-sm">{item.otherUser.nickname}</p>
                    <span className="text-xs text-text-muted">· 第 {item.roundNumber} 期</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <StatusBadge status={item.status} myDecision={item.myDecision} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
