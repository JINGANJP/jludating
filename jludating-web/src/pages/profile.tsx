import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Plus, X } from 'lucide-react'
import { profileApi, type ProfileData } from '@/api/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectItem } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const GENDER_OPTIONS = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
  { value: 'UNDISCLOSED', label: '不愿透露' },
]

const MBTI_OPTIONS = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]

const GRADE_OPTIONS = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士生', '其他']

const EMPTY_FORM: Partial<ProfileData> = {
  nickname: '',
  gender: null,
  grade: '',
  major: '',
  department: '',
  hometown: '',
  mbti: '',
  bio: '',
  highlightedQuote: '',
  tags: [],
}

function calcCompletion(form: Partial<ProfileData>): number {
  const fields: (keyof ProfileData)[] = [
    'nickname', 'gender', 'grade', 'major', 'department',
    'hometown', 'mbti', 'bio',
  ]
  const filled = fields.filter(f => {
    const val = form[f]
    return val !== '' && val !== null && val !== undefined
  }).length
  return Math.round((filled / fields.length) * 100)
}

const checklist = [
  { field: 'nickname' as keyof ProfileData, label: '昵称' },
  { field: 'gender' as keyof ProfileData, label: '性别' },
  { field: 'grade' as keyof ProfileData, label: '年级' },
  { field: 'department' as keyof ProfileData, label: '院系' },
  { field: 'major' as keyof ProfileData, label: '专业' },
  { field: 'hometown' as keyof ProfileData, label: '家乡' },
  { field: 'mbti' as keyof ProfileData, label: 'MBTI' },
  { field: 'bio' as keyof ProfileData, label: '自我介绍' },
]

export function ProfilePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<ProfileData>>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ProfileData>) => profileApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast({ title: '✓ 保存成功', description: '资料已更新' })
      setIsDirty(false)
    },
    onError: () => {
      toast({ title: '保存失败', description: '请稍后重试', variant: 'destructive' })
    },
  })

  useEffect(() => {
    if (profile) {
      setForm({
        nickname: profile.nickname ?? '',
        avatarUrl: profile.avatarUrl ?? '',
        bio: profile.bio ?? '',
        gender: profile.gender ?? null,
        grade: profile.grade ?? '',
        major: profile.major ?? '',
        department: profile.department ?? '',
        mbti: profile.mbti ?? '',
        tags: profile.tags ?? [],
        hometown: profile.hometown ?? '',
        highlightedQuote: profile.highlightedQuote ?? '',
        profileCompletion: profile.profileCompletion,
        email: profile.email,
      })
    }
  }, [profile])

  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag || form.tags?.includes(tag) || (form.tags?.length ?? 0) >= 10) return
    set('tags', [...(form.tags ?? []), tag])
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    set('tags', (form.tags ?? []).filter(t => t !== tag))
  }

  const completion = calcCompletion(form)

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
          <div className="space-y-4">
            {[80, 60, 100, 60, 80].map((w, i) => (
              <div key={i} className={`h-10 rounded-xl bg-surface animate-pulse`} style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div className="h-48 rounded-2xl border border-border/50 bg-surface animate-pulse" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* 左：编辑表单 */}
      <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-text-primary">个人资料</h2>
          <p className="mt-1 text-sm text-text-secondary">完善资料，让对方更了解你</p>
        </div>

        <div className="space-y-5">
          {/* 基本信息 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-sm font-medium">
                昵称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nickname"
                placeholder="给自己起个昵称"
                value={form.nickname ?? ''}
                onChange={e => set('nickname', e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-sm font-medium">性别</Label>
              <Select
                value={form.gender ?? ''}
                onValueChange={v => set('gender', v as ProfileData['gender'])}
              >
                <SelectItem value="">选择性别</SelectItem>
                {GENDER_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="grade" className="text-sm font-medium">年级</Label>
              <Select
                value={form.grade ?? ''}
                onValueChange={v => set('grade', v)}
              >
                <SelectItem value="">选择年级</SelectItem>
                {GRADE_OPTIONS.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hometown" className="text-sm font-medium">家乡</Label>
              <Input
                id="hometown"
                placeholder="如：吉林省长春市"
                value={form.hometown ?? ''}
                onChange={e => set('hometown', e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-sm font-medium">院系</Label>
              <Input
                id="department"
                placeholder="如：计算机科学与技术学院"
                value={form.department ?? ''}
                onChange={e => set('department', e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="major" className="text-sm font-medium">专业</Label>
              <Input
                id="major"
                placeholder="如：软件工程"
                value={form.major ?? ''}
                onChange={e => set('major', e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mbti" className="text-sm font-medium">MBTI</Label>
            <Select
              value={form.mbti ?? ''}
              onValueChange={v => set('mbti', v)}
              className="w-full sm:w-[200px]"
            >
              <SelectItem value="">选择 MBTI</SelectItem>
              {MBTI_OPTIONS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm font-medium">自我介绍</Label>
            <Textarea
              id="bio"
              placeholder="用几句话介绍一下自己，让对方更了解你的日常和想法…"
              rows={4}
              value={form.bio ?? ''}
              onChange={e => set('bio', e.target.value)}
              className="rounded-xl resize-none text-sm"
            />
            <p className="text-xs text-text-muted text-right">{(form.bio ?? '').length} / 200</p>
          </div>

          {/* 个性标签 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">个性标签 <span className="text-text-muted font-normal">（最多 10 个）</span></Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入标签后按回车添加"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="rounded-xl h-10 text-sm"
                maxLength={15}
              />
              <Button type="button" variant="secondary" onClick={addTag} size="sm" className="h-10 rounded-xl px-3 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/8 border border-primary/15 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full hover:bg-primary/15 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => updateMutation.mutate({ ...form, profileCompletion: completion })}
              disabled={!isDirty || updateMutation.isPending}
              className="h-10 px-6 rounded-xl font-medium"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  保存中…
                </span>
              ) : '保存资料'}
            </Button>
          </div>
        </div>
      </div>

      {/* 右：完成度 + 提示 */}
      <div className="space-y-5">
        {/* 完成度卡片 */}
        <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
          <h3 className="font-semibold text-text-primary mb-5">资料完成度</h3>

          {/* 环形进度替代 */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/40" />
                <circle
                  cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - completion / 100)}`}
                  className="text-primary transition-all duration-700"
                />
              </svg>
              <span className="absolute text-base font-bold text-text-primary">{completion}%</span>
            </div>
            <div>
              <p className="font-semibold text-text-primary">
                {completion >= 100 ? '全部完成！' : completion >= 60 ? '已达报名门槛' : `还差 ${60 - completion}%`}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {completion >= 60 ? '满足报名条件' : '完成度需达 60% 才可报名'}
              </p>
            </div>
          </div>

          {/* 检查清单 */}
          <div className="space-y-2.5">
            {checklist.map(({ field, label }) => {
              const val = form[field]
              const done = val !== '' && val !== null && val !== undefined
              return (
                <div key={String(field)} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    done ? 'text-emerald-500' : 'text-border'
                  )} />
                  <span className={done ? 'text-text-primary' : 'text-text-secondary'}>{label}</span>
                  {done && <span className="ml-auto text-xs text-emerald-600 font-medium">✓</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* 报名条件说明 */}
        <div className="rounded-2xl border border-border/50 bg-background p-5 shadow-sm">
          <h3 className="font-semibold text-text-primary text-sm mb-3">报名条件</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className={cn('flex items-center gap-2', completion >= 60 && 'text-emerald-700')}>
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', completion >= 60 ? 'bg-emerald-500' : 'bg-border')} />
              资料完成度 ≥ 60%（当前 {completion}%）
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
              问卷完成度达到 100%
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-border shrink-0" />
              每期只允许报名一次
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
