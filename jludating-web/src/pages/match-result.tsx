import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Check, X, ArrowLeft, Sparkles, Users, Lock, RefreshCw } from 'lucide-react'
import { matchingApi } from '@/api/match'
import { cn } from '@/lib/utils'

// ========== 维度颜色映射 ==========
const DIM_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  love_attitude: { bar: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },
  values: { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-600' },
  lifestyle: { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  personality: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  social: { bar: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  relationship_goal: { bar: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-600' },
  hobby: { bar: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-600' },
  preference: { bar: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
  mbti_compat: { bar: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-600' },
}

const DIM_LABELS: Record<string, string> = {
  love_attitude: '💕 恋爱态度',
  values: '🎯 价值观',
  lifestyle: '🌙 生活方式',
  personality: '🧠 人格特质',
  social: '🤝 社交风格',
  relationship_goal: '💍 关系目标',
  hobby: '🎨 兴趣爱好',
  preference: '💝 对方偏好',
  mbti_compat: '✨ MBTI 契合',
}

// 契合度文案
function getScoreLabel(score: number) {
  if (score >= 85) return { label: '灵魂伴侣', emoji: '💎', desc: '你们在多个维度高度契合，非常难得！' }
  if (score >= 75) return { label: '理想型', emoji: '🌟', desc: '你们的三观和生活方式非常合拍！' }
  if (score >= 65) return { label: '潜力股', emoji: '🌱', desc: '你们有一定的契合基础，值得深入了解！' }
  if (score >= 55) return { label: '互补型', emoji: '🔮', desc: '你们各有特点，或许能互相补充！' }
  return { label: '待了解', emoji: '💭', desc: '差异不代表不合适，相处中或许会有惊喜！' }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'from-rose-500 to-pink-500'
  if (score >= 65) return 'from-violet-500 to-purple-500'
  if (score >= 50) return 'from-blue-500 to-cyan-500'
  return 'from-gray-400 to-gray-500'
}

interface CompatibilityDetail {
  totalScore: number
  dimensionBreakdown: Record<string, number>
}

interface MatchResult {
  matched: boolean
  message?: string
  nickname?: string
  major?: string
  bio?: string
  avatarUrl?: string
  tags?: string[]
  status?: string
  accepted?: boolean
  similarityScore?: number
  compatibilityDetail?: CompatibilityDetail
}

export function MatchResultPage() {
  const navigate = useNavigate()
  const [result, setResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [tab, setTab] = useState<'profile' | 'analysis'>('profile')

  useEffect(() => {
    matchingApi.getCurrentResult()
      .then(r => setResult(r))
      .catch(() => setResult({ matched: false, message: '加载失败，请稍后重试' }))
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = async () => {
    setActioning(true)
    try {
      await matchingApi.accept()
      setResult(prev => prev ? { ...prev, status: 'accepted', accepted: true } : prev)
    } catch {}
    setActioning(false)
  }

  const handleDecline = async () => {
    setActioning(true)
    try {
      await matchingApi.decline()
      setResult(prev => prev ? { ...prev, status: 'declined' } : prev)
    } catch {}
    setActioning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-text-secondary">正在揭晓你的缘分...</p>
        </div>
      </div>
    )
  }

  // 未匹配
  if (!result?.matched) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-rose-300" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-text-primary mb-3">缘分尚在路上</h2>
          <p className="text-text-secondary leading-relaxed mb-8">
            {result?.message ?? '暂未匹配到结果，请耐心等待下期开放'}
          </p>
          <button
            onClick={() => navigate('/match-lobby')}
            className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            返回匹配大厅
          </button>
        </div>
      </div>
    )
  }

  const score = result.compatibilityDetail?.totalScore ?? result.similarityScore ?? 0
  const breakdown = result.compatibilityDetail?.dimensionBreakdown ?? {}
  const scoreInfo = getScoreLabel(score)
  const scoreGradient = getScoreColor(score)
  const isPending = result.status === 'pending'
  const isAccepted = result.status === 'accepted'
  const isDeclined = result.status === 'declined'

  // 按分数排序维度
  const sortedDims = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .filter(([, s]) => s > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/match-lobby')}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回匹配大厅
        </button>

        {/* 匹配卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/60 overflow-hidden mb-6">
          {/* 头部：契合度分 */}
          <div className={cn('bg-gradient-to-br px-6 py-8 text-center', scoreGradient.replace('bg-', 'bg-gradient-to-br from-'), scoreGradient.includes('rose') ? 'to-pink-500/80' : scoreGradient.includes('violet') ? 'to-purple-500/80' : scoreGradient.includes('blue') ? 'to-cyan-500/80' : 'to-gray-500/80')}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{scoreInfo.emoji}</span>
              <span className="text-white/80 text-sm font-medium">{scoreInfo.label}</span>
            </div>
            <div className="text-7xl font-display font-bold text-white mb-1">{score}</div>
            <div className="text-white/70 text-sm">综合契合度</div>
            <p className="text-white/80 text-xs mt-3 max-w-xs mx-auto leading-relaxed">{scoreInfo.desc}</p>
          </div>

          {/* 用户信息 */}
          <div className="px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {result.avatarUrl ? (
                  <img src={result.avatarUrl} alt={result.nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-display font-semibold text-rose-400">
                    {(result.nickname ?? '?').charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg font-semibold text-text-primary">{result.nickname}</h3>
                {result.major && <p className="text-sm text-text-secondary mt-0.5">{result.major}</p>}
                {result.bio && (
                  <p className="text-sm text-text-muted mt-2 leading-relaxed line-clamp-2">{result.bio}</p>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {result.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 标签页 */}
          {isPending && (
            <div className="px-6 border-t border-border/40">
              <div className="flex">
                <button
                  onClick={() => setTab('profile')}
                  className={cn(
                    'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                    tab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-text-muted'
                  )}
                >
                  TA 的资料
                </button>
                <button
                  onClick={() => setTab('analysis')}
                  className={cn(
                    'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
                    tab === 'analysis' ? 'border-primary text-primary' : 'border-transparent text-text-muted'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  契合度分析
                </button>
              </div>
            </div>
          )}

          {/* 操作区 */}
          {isPending && (
            <div className="px-6 py-5">
              {tab === 'profile' ? (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      对方也完成了问卷，表示对你有兴趣 ✨
                      <br />如果你也觉得合适，可以接受这次匹配
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDecline}
                      disabled={actioning}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border/80 text-text-secondary hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      <X className="w-4 h-4" />
                      婉拒
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={actioning}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-60"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      接受匹配
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-text-muted text-center mb-3">
                    以下是你们在各维度的契合程度（仅供参考）
                  </p>
                  {sortedDims.map(([dim, s]) => {
                    const colors = DIM_COLORS[dim] ?? { bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' }
                    return (
                      <div key={dim} className="flex items-center gap-3">
                        <span className={cn('text-xs font-medium w-24 flex-shrink-0', colors.text)}>
                          {DIM_LABELS[dim] ?? dim}
                        </span>
                        <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', colors.bar)}
                            style={{ width: `${s}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-text-primary w-8 text-right">{s}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {isAccepted && (
            <div className="px-6 py-5 border-t border-border/40">
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="font-display text-base font-semibold text-emerald-600 mb-1">匹配成功！</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  你们已互相接受，平台会通过站内信通知对方联系方式 💕
                </p>
              </div>
            </div>
          )}

          {isDeclined && (
            <div className="px-6 py-5 border-t border-border/40">
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <X className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="font-display text-base font-semibold text-gray-500 mb-1">已婉拒</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  期待下一期相遇 ❤️
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 提示卡片 */}
        <div className="bg-white rounded-xl border border-border/60 p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-secondary">隐私保护说明</p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                双方互相接受后，平台将通过站内信交换联系方式。在此之前，双方身份完全保密。
              </p>
            </div>
          </div>
        </div>

        {/* 历史记录入口 */}
        <button
          onClick={() => navigate('/history')}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          查看历史匹配记录
        </button>
      </div>
    </div>
  )
}
