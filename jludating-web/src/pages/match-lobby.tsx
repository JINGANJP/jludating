import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Heart, Calendar, Clock, ChevronRight, CheckCircle, AlertCircle,
  Sparkles, School, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { matchingApi } from '@/api/match'
import { userApi } from '@/api/user'
import { questionnaireApi } from '@/api/questionnaire'

// ========== 长春高校数据 ==========
const UNIVERSITIES = [
  { id: 'jlu', name: '吉林大学', short: '吉大', domains: ['jlu.edu.cn', 'mails.jlu.edu.cn'] },
  { id: 'neu', name: '东北师范大学', short: '东师', domains: ['nenu.edu.cn', 'mails.nenu.edu.cn'] },
  { id: 'ccut', name: '长春理工大学', short: '理工', domains: ['ccut.edu.cn', 'mails.ccut.edu.cn'] },
  { id: 'ccu', name: '长春大学', short: '长大', domains: ['ccu.edu.cn', 'mails.ccu.edu.cn'] },
  { id: 'jlrtu', name: '长春工业大学', short: '工大', domains: ['ccut.edu.cn', 'jlut.edu.cn', 'mails.ccut.edu.cn'] },
  { id: 'jlau', name: '吉林农业大学', short: '农大', domains: ['jlau.edu.cn', 'mails.jlau.edu.cn'] },
  { id: 'cczu', name: '长春中医药大学', short: '中医', domains: ['ccatcm.edu.cn', 'mails.ccatcm.edu.cn'] },
  { id: 'jlipu', name: '吉林财经大学', short: '吉财', domains: ['jlufe.edu.cn', 'mails.jlufe.edu.cn'] },
]

// 维度中文标签（与问卷对应）
const DIMENSION_LABELS: Record<string, string> = {
  love_attitude: '💕 恋爱态度',
  values: '🎯 价值观',
  lifestyle: '🌙 生活方式',
  personality: '🧠 人格特质',
  social: '🤝 社交风格',
  relationship_goal: '💍 关系目标',
  hobby: '🎨 兴趣爱好',
  preference: '💝 对方偏好',
}

function getStatusBadge(status: string, participantCount: number) {
  if (status === 'open') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        报名中
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        匹配中
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-xs font-medium border border-gray-200">
      已结束
    </span>
  )
}

function calcQuestionnaireCompletion(answers: Record<string, unknown>) {
  // 问卷总共 52 题（与后端 QUESTIONNAIRE_TOTAL_QUESTIONS 保持一致）
  const total = 52
  const valid = Object.entries(answers)
    .filter(([k, v]) => k !== '_submitted' && v && (Array.isArray(v) ? v.length > 0 : true)).length
  return Math.round((valid / total) * 100)
}

interface RoundInfo {
  roundNumber: number
  status: string
  participantCount: number
  startsAt: string | null
  endsAt: string | null
}

export function MatchLobbyPage() {
  const [round, setRound] = useState<RoundInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joinMsg, setJoinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [questionnaireCompletion, setQuestionnaireCompletion] = useState(0)
  const [matchStatus, setMatchStatus] = useState<string | null>(null)
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    // 加载轮次信息
    matchingApi.getCurrentRound()
      .then(r => setRound(r))
      .catch(() => setRound(null))
      .finally(() => setLoading(false))

    // 加载资料完成度
    userApi.getMe()
      .then(r => setProfileCompletion(r.profileCompletion ?? 0))
      .catch(() => {})

    // 加载问卷完成度
    questionnaireApi.getDraft()
      .then(r => setQuestionnaireCompletion(calcQuestionnaireCompletion(r.answers)))
      .catch(() => setQuestionnaireCompletion(0))

    // 加载匹配结果状态
    matchingApi.getCurrentResult()
      .then(r => setMatchStatus(r.status ?? null))
      .catch(() => setMatchStatus(null))
  }, [])

  const toggleSchool = (id: string) => {
    setSelectedSchools(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const selectAllSchools = () => {
    setSelectedSchools(UNIVERSITIES.map(u => u.id))
  }

  const clearSchools = () => {
    setSelectedSchools([])
  }

  const canJoin = profileCompletion >= 60 && questionnaireCompletion >= 80
  const isOpen = round?.status === 'open'
  const isRunning = round?.status === 'running'

  const handleJoin = async () => {
    if (!canJoin) return
    setJoining(true)
    setJoinMsg(null)
    try {
      const r = await matchingApi.join()
      setJoinMsg({ type: 'success', text: r.message ?? '报名成功！' })
      // 更新轮次信息
      const roundRes = await matchingApi.getCurrentRound()
      setRound(roundRes)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setJoinMsg({ type: 'error', text: err.response?.data?.message ?? '报名失败，请重试' })
    }
    setJoining(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* 轮次卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/60 overflow-hidden mb-6">
          {/* 背景装饰 */}
          <div className="h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-indigo-400" />

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    第 {round?.roundNumber ?? '-'} 期匹配
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">等你来遇见</p>
                </div>
              </div>
              {getStatusBadge(round?.status ?? 'closed', round?.participantCount ?? 0)}
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-rose-50 rounded-xl p-3 text-center">
                <div className="text-xl font-display font-bold text-rose-600">{round?.participantCount ?? 0}</div>
                <div className="text-xs text-rose-500 mt-0.5">报名人数</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <div className="text-xl font-display font-bold text-violet-600">
                  {round?.startsAt ? new Date(round.startsAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '-'}
                </div>
                <div className="text-xs text-violet-500 mt-0.5">开始日期</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <div className="text-xl font-display font-bold text-indigo-600">
                  {round?.endsAt ? new Date(round.endsAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '-'}
                </div>
                <div className="text-xs text-indigo-500 mt-0.5">截止日期</div>
              </div>
            </div>

            {/* 报名按钮 */}
            {isOpen && (
              <button
                onClick={handleJoin}
                disabled={joining || !canJoin}
                className={cn(
                  'w-full py-3.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2',
                  canJoin
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {joining ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    报名中...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-current" />
                    报名本期匹配
                  </>
                )}
              </button>
            )}

            {isRunning && (
              <div className="w-full py-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-sm text-amber-700">匹配算法运行中，请耐心等待结果揭晓...</p>
              </div>
            )}

            {joinMsg && (
              <div className={cn(
                'mt-3 p-3 rounded-xl text-sm text-center',
                joinMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              )}>
                {joinMsg.type === 'success' ? <CheckCircle className="w-4 h-4 inline mr-1.5" /> : <AlertCircle className="w-4 h-4 inline mr-1.5" />}
                {joinMsg.text}
              </div>
            )}
          </div>
        </div>

        {/* 条件检查 */}
        {!canJoin && (
          <div className="bg-white rounded-xl border border-border/60 p-4 mb-6">
            <p className="text-xs font-medium text-text-secondary mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              报名条件未满足
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <School className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-xs text-text-secondary">资料完成度</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-border/40 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', profileCompletion >= 60 ? 'bg-emerald-500' : 'bg-rose-400')} style={{ width: `${Math.min(profileCompletion, 100)}%` }} />
                  </div>
                  <span className={cn('text-xs font-medium w-10', profileCompletion >= 60 ? 'text-emerald-600' : 'text-rose-500')}>
                    {profileCompletion}%
                  </span>
                  {profileCompletion >= 60 ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Link to="/profile" className="text-xs text-primary hover:underline">去完善</Link>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-xs text-text-secondary">问卷完成度</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-border/40 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', questionnaireCompletion >= 80 ? 'bg-emerald-500' : 'bg-rose-400')} style={{ width: `${Math.min(questionnaireCompletion, 100)}%` }} />
                  </div>
                  <span className={cn('text-xs font-medium w-10', questionnaireCompletion >= 80 ? 'text-emerald-600' : 'text-rose-500')}>
                    {questionnaireCompletion}%
                  </span>
                  {questionnaireCompletion >= 80 ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Link to="/questionnaire" className="text-xs text-primary hover:underline">去填写</Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 高校筛选 */}
        <div className="bg-white rounded-xl border border-border/60 p-4 mb-6">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-text-primary">高校筛选</span>
              {selectedSchools.length > 0 && selectedSchools.length < UNIVERSITIES.length && (
                <span className="px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 text-xs">
                  {selectedSchools.length} 所已选
                </span>
              )}
              {selectedSchools.length === 0 && (
                <span className="text-xs text-text-muted">（默认全选）</span>
              )}
            </div>
            <ChevronRight className={cn('w-4 h-4 text-text-muted transition-transform', filterOpen && 'rotate-90')} />
          </button>

          {filterOpen && (
            <div className="mt-4">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={selectAllSchools}
                  className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 text-xs font-medium hover:bg-violet-100 transition-colors"
                >
                  全选
                </button>
                <button
                  onClick={clearSchools}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 text-text-secondary text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                  清空
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {UNIVERSITIES.map(u => {
                  const selected = selectedSchools.includes(u.id) || selectedSchools.length === 0
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleSchool(u.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        selected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-text-secondary border-border/80 hover:border-primary/40'
                      )}
                    >
                      {u.name}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-text-muted mt-3">
                {selectedSchools.length === 0
                  ? '已默认匹配所有长春高校同学'
                  : `仅匹配 ${selectedSchools.map(id => UNIVERSITIES.find(u => u.id === id)?.name).join('、')} 的同学`}
              </p>
            </div>
          )}
        </div>

        {/* 操作卡片 */}
        <div className="space-y-3">
          <Link
            to="/questionnaire"
            className="block bg-white rounded-xl border border-border/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">问卷调查</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {questionnaireCompletion >= 80 ? '已完成，继续完善' : `已完成 ${questionnaireCompletion}%`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <Link
            to="/profile"
            className="block bg-white rounded-xl border border-border/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">个人资料</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {profileCompletion >= 60 ? '已完成，继续完善' : `已完成 ${profileCompletion}%`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <Link
            to="/match/result"
            className="block bg-white rounded-xl border border-border/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">匹配结果</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {matchStatus === 'pending' ? '结果已出，请查看' : matchStatus === 'accepted' ? '匹配成功 💕' : '查看历次匹配记录'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <Link
            to="/history"
            className="block bg-white rounded-xl border border-border/60 p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">匹配历史</p>
                  <p className="text-xs text-text-muted mt-0.5">查看往期匹配记录</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>

        {/* 底部说明 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-border/40">
          <p className="text-xs text-text-muted leading-relaxed">
            💡 每期匹配结束后，系统会根据问卷答案计算你们的契合度分数。双方互相接受后，平台将交换联系方式。在那之前，双方身份完全保密。
          </p>
        </div>
      </div>
    </div>
  )
}
