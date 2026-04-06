import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react'
import { useAuthStore } from '../stores/use-auth-store'
import { questionnaireApi } from '@/api/questionnaire'
import { cn } from '@/lib/utils'

// ========== 问卷题目数据（与后端匹配引擎对齐）==========
interface Question {
  id: string
  dimension: string
  dimensionLabel: string
  question: string
  type: 'single' | 'multi'
  options: string[]
  hint?: string
}

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

const QUESTIONS: Question[] = [
  // ---- 恋爱态度 ----
  {
    id: 'participate_purpose', dimension: 'love_attitude', dimensionLabel: '💕 恋爱态度',
    question: '你参与这次匹配，最希望的是什么？',
    type: 'single',
    options: [
      '认真想谈恋爱，找到合适的ta',
      '扩展社交圈，认识有趣的人',
      '体验一下，不确定会不会认真',
      '朋友推荐，好奇试试看',
    ],
    hint: '如实选择，这会影响你的匹配结果',
  },
  {
    id: 'relationship_exp', dimension: 'love_attitude', dimensionLabel: '💕 恋爱态度',
    question: '你的感情经历是？',
    type: 'single',
    options: ['母胎 solo，从未恋爱过', '有过 1 段经历', '有过 2-3 段', '3 段以上'],
  },
  {
    id: 'single_duration', dimension: 'love_attitude', dimensionLabel: '💕 恋爱态度',
    question: '你单身多久了？',
    type: 'single',
    options: ['不到 3 个月', '3 个月～1 年', '1～2 年', '2 年以上'],
  },
  {
    id: 'desire_level', dimension: 'love_attitude', dimensionLabel: '💕 恋爱态度',
    question: '你现在想谈恋爱的心情有多强烈？',
    type: 'single',
    options: ['不强，顺其自然', '有一点期待', '比较想谈恋爱', '非常想！已经在积极寻找'],
  },
  {
    id: 'quick_marriage', dimension: 'love_attitude', dimensionLabel: '💕 恋爱态度',
    question: '你能接受「闪婚」吗？',
    type: 'single',
    options: ['完全不考虑', '认识 3 个月后可以考虑', '认识半年后可以考虑', '遇到对的人，时间不是问题'],
  },

  // ---- 价值观 ----
  {
    id: 'money_style', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '你的消费习惯是怎样的？',
    type: 'single',
    options: ['月光，想花就花', '存一点花一点', '有储蓄计划，理性消费', '有投资理财习惯'],
  },
  {
    id: 'spending_on_partner', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '为对象花钱，你的心态是？',
    type: 'single',
    options: ['学生党，能省则省', '偶尔愿意为对方花大钱', '觉得应该礼尚往来', '愿意为喜欢的人付出'],
  },
  {
    id: 'family_value', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '你对未来家庭的期待是？',
    type: 'single',
    options: ['父母最重要，尽量和父母同住', '保持一碗汤的距离最好', '独立生活为主，常回家看看', '家庭和工作平衡即可'],
  },
  {
    id: 'education_value', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '你如何看待学历？',
    type: 'single',
    options: ['必须985/211', '本科及以上就够了', '学历不重要，能力更重要', '学校只是人生一小部分'],
  },
  {
    id: 'life_priority', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '你目前的人生优先级是什么？',
    type: 'single',
    options: ['学业/事业第一，感情随缘', '找到合适的人一起奋斗', '学业事业和感情都很重要', '享受当下最重要'],
  },
  {
    id: 'city_preference', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '你毕业后想留在哪里发展？',
    type: 'single',
    options: ['长春 / 吉林省内', '优先东北地区', '可以接受全国范围内', '想去更大的城市闯荡'],
  },
  {
    id: 'plan_style', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '你是一个有规划的人吗？',
    type: 'single',
    options: ['走一步看一步，随遇而安', '有大致方向但不细化', '有短期规划（1年内）', '有清晰的长期人生规划'],
  },

  // ---- 生活方式 ----
  {
    id: 'sleep_type', dimension: 'lifestyle', dimensionLabel: '🌙 生活方式',
    question: '你的作息类型是？',
    type: 'single',
    options: ['早睡早起型（22:00前睡）', '正常作息（22-24点睡）', '晚睡晚起型（0点后睡）', '不规律，看情况'],
    hint: '作息匹配对于同居/婚后生活很重要哦',
  },
  {
    id: 'morning_mood', dimension: 'lifestyle', dimensionLabel: '🌙 生活方式',
    question: '早上起床后你的状态是？',
    type: 'single',
    options: ['元气满满，很快清醒', '需要10分钟缓冲', '起床困难户，闹钟轰炸', '看睡眠质量'],
  },
  {
    id: 'nap_habit', dimension: 'lifestyle', dimensionLabel: '🌙 生活方式',
    question: '你有午睡的习惯吗？',
    type: 'single',
    options: ['每天必须午睡', '偶尔午睡', '从不午睡', '看情况'],
  },
  {
    id: 'exercise_freq', dimension: 'lifestyle', dimensionLabel: '🌙 生活方式',
    question: '你平时运动频率是？',
    type: 'single',
    options: ['几乎不运动', '每周 1-2 次', '每周 3-4 次', '每周 5 次以上/每天'],
  },
  {
    id: 'exercise_type', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '你喜欢哪些运动？（可多选）',
    type: 'multi',
    options: ['跑步/快走', '游泳', '健身/力量训练', '篮球/足球/排球', '羽毛球/乒乓球', '瑜伽/普拉提/冥想', '骑行', '爬山/徒步', '舞蹈', '其他'],
    hint: '多选，喜欢什么就选什么',
  },
  {
    id: 'diet_pref', dimension: 'lifestyle', dimensionLabel: '🌙 生活方式',
    question: '你的饮食习惯是？',
    type: 'single',
    options: ['无辣不欢，重口味', '清淡为主', '什么都吃，不挑', '偏爱甜食/西餐'],
  },
  {
    id: 'cooking_freq', dimension: 'lifestyle', dimensionLabel: '🌙 生活方式',
    question: '你做饭的频率是？',
    type: 'single',
    options: ['从不做饭，外卖为主', '偶尔下厨', '经常自己做饭', '热爱烹饪，会研究菜谱'],
  },
  {
    id: 'caffeine', dimension: 'lifestyle', dimensionLabel: '🌙 生活方式',
    question: '你对咖啡/茶的依赖程度？',
    type: 'single',
    options: ['完全不需要', '偶尔一杯提神', '每天至少一杯', '咖啡因重度依赖'],
  },
  {
    id: 'weekend_activity', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '周末你通常会做什么？（可多选）',
    type: 'multi',
    options: ['宅家休息/追剧/打游戏', '和朋友聚会/社交', '户外运动/健身', '学习/看书/考证', '逛街/购物/美食探店', '旅行/短途出游', '兼职/实习/工作'],
    hint: '多选，选出你周末常做的事',
  },
  {
    id: 'short_term_goal', dimension: 'values', dimensionLabel: '🎯 价值观',
    question: '你目前的短期目标是什么？',
    type: 'single',
    options: ['专注学业/考研/保研', '找一份好实习/工作', '发展兴趣爱好', '搞钱/经济独立', '谈一场认真的恋爱'],
  },

  // ---- 人格特质 ----
  {
    id: 'personality_type', dimension: 'personality', dimensionLabel: '🧠 人格特质',
    question: '你的性格类型更偏向？',
    type: 'single',
    options: ['非常内向，享受独处', '偏内向，但熟人面前很活跃', '偏外向，喜欢社交', '非常外向，人来疯'],
    hint: '没有好坏之分，如实选择即可',
  },
  {
    id: 'emotion_handle', dimension: 'personality', dimensionLabel: '🧠 人格特质',
    question: '当你情绪不好时，通常会怎么做？',
    type: 'single',
    options: ['自己消化，不愿意说', '和朋友倾诉', '直接表达出来', '写日记/运动/转移注意力'],
  },
  {
    id: 'fight_after', dimension: 'personality', dimensionLabel: '🧠 人格特质',
    question: '和对象吵架之后，你通常会？',
    type: 'single',
    options: ['冷静下来主动道歉', '需要对方先道歉', '吵完就忘了', '会冷战一阵子'],
    hint: '冲突处理方式是恋爱中很重要的话题',
  },
  {
    id: 'cold_war', dimension: 'personality', dimensionLabel: '🧠 人格特质',
    question: '你会冷战吗？',
    type: 'single',
    options: ['从不冷战，有话直说', '偶尔冷战，很快就结束', '冷战是我的惯用方式', '视情况而定'],
  },
  {
    id: 'decision_style', dimension: 'personality', dimensionLabel: '🧠 人格特质',
    question: '你做决定的方式是？',
    type: 'single',
    options: ['果断快速，不犹豫', '权衡利弊后决定', '经常犹豫不决', '视问题大小而定'],
  },
  {
    id: 'time_punctuality', dimension: 'personality', dimensionLabel: '🧠 人格特质',
    question: '你的时间观念是？',
    type: 'single',
    options: ['总是迟到，已习惯', '基本准时，偶尔小迟到', '非常准时，提前到', '看心情看场合'],
  },
  {
    id: 'mbti_type', dimension: 'personality', dimensionLabel: '🧠 人格特质',
    question: '你的 MBTI 是？（不了解可不填）',
    type: 'single',
    options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', '不太了解/不想填'],
    hint: 'MBTI 兼容性会影响部分匹配分数',
  },

  // ---- 社交风格 ----
  {
    id: 'social_style', dimension: 'social', dimensionLabel: '🤝 社交风格',
    question: '你的社交频率是？',
    type: 'single',
    options: ['独来独往，不需要太多社交', '少数几个知心好友足够', '有稳定的社交圈', '朋友很多，社交达人'],
  },
  {
    id: 'friend_quality', dimension: 'social', dimensionLabel: '🤝 社交风格',
    question: '你更看重朋友的什么？',
    type: 'single',
    options: ['宁缺毋滥，质量优先', '有几个真心朋友', '朋友圈比较大', '朋友遍天下'],
  },
  {
    id: 'friend_overlap', dimension: 'social', dimensionLabel: '🤝 社交风格',
    question: '你希望和对象的朋友圈？',
    type: 'single',
    options: ['不希望重合，私人空间很重要', '有少量重合最好', '朋友圈完全重合也 OK', '希望认识对方的朋友'],
  },
  {
    id: 'social_media', dimension: 'social', dimensionLabel: '🤝 社交风格',
    question: '你在社交媒体上活跃吗？',
    type: 'single',
    options: ['基本不发朋友圈', '偶尔分享生活', '经常发朋友圈/小红书', '社交媒体重度用户'],
  },
  {
    id: 'alone_need', dimension: 'social', dimensionLabel: '🤝 社交风格',
    question: '你有多需要独处的时间？',
    type: 'single',
    options: ['每天都需要独处时间', '偶尔需要独处', '大部分时间喜欢有人陪', '完全不需要独处'],
  },

  // ---- 关系目标 ----
  {
    id: 'relationshipGoal', dimension: 'relationship_goal', dimensionLabel: '💍 关系目标',
    question: '这次匹配，你最想要什么样的关系？',
    type: 'single',
    options: ['以结婚为前提，认真交往', '认真谈恋爱，不设限终点', '先相处看看，顺其自然', '先做朋友，再看发展'],
    hint: '这是最重要的匹配维度之一，请认真选择',
  },
  {
    id: 'relationship_pace', dimension: 'relationship_goal', dimensionLabel: '💍 关系目标',
    question: '你希望的关系节奏是？',
    type: 'single',
    options: ['慢慢来，深入了解再说', '正常节奏', '希望尽快确认关系', '希望在 1 个月内确定关系'],
  },
  {
    id: 'ex_handling', dimension: 'relationship_goal', dimensionLabel: '💍 关系目标',
    question: '你对前任的态度是？',
    type: 'single',
    options: ['完全不介意，那是过去', '偶尔提及能理解', '希望没有前任联系', '希望了解更多后再判断'],
  },
  {
    id: 'long_dist', dimension: 'relationship_goal', dimensionLabel: '💍 关系目标',
    question: '你能接受异地恋吗？',
    type: 'single',
    options: ['完全不接受异地', '短期异地可以（<6个月）', '中长期异地可以（6个月-2年）', '距离不是问题'],
  },
  {
    id: 'ex_public', dimension: 'relationship_goal', dimensionLabel: '💍 关系目标',
    question: '你愿意公开讨论前任吗？',
    type: 'single',
    options: ['完全不公开前任信息', '知道有过前任就行', '可以偶尔提起', '可以大方讨论'],
  },

  // ---- 兴趣爱好 ----
  {
    id: 'hobby_interest', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '你有哪些兴趣爱好？（可多选）',
    type: 'multi',
    options: ['阅读/文学', '电影/追剧', '音乐/乐器', '旅行/户外', '美食/探店', '游戏/电竞', '运动健身', '摄影/短视频', '动漫/二次元', '科技/数码', '绘画/艺术', '养宠物', '其他'],
    hint: '多选，共同爱好能增加匹配分数',
  },
  {
    id: 'reading', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '你平时阅读的频率是？',
    type: 'single',
    options: ['几乎不读', '偶尔翻翻', '经常阅读（非专业书籍）', '深度阅读爱好者'],
  },
  {
    id: 'movie_type', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '你喜欢哪些类型的影视？（可多选）',
    type: 'multi',
    options: ['爱情片', '科幻/奇幻', '悬疑/推理', '喜剧', '动作/超级英雄', '纪录片', '日韩剧', '国产剧', '欧美剧', '动漫'],
    hint: '多选，选你真正喜欢看的类型',
  },
  {
    id: 'music_type', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '你喜欢什么类型的音乐？（可多选）',
    type: 'multi',
    options: ['流行音乐', '摇滚', '民谣', '说唱/HipHop', '古典/交响乐', '电子/EDM', 'R&B/Soul', 'ACG/动漫音乐', '轻音乐/纯音乐'],
    hint: '多选',
  },
  {
    id: 'travel', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '你喜欢旅行吗？',
    type: 'single',
    options: ['很少出行', '偶尔周边游', '经常旅行，探索新地方', '旅行达人，喜欢深度游'],
  },
  {
    id: 'pet', dimension: 'hobby', dimensionLabel: '🎨 兴趣爱好',
    question: '你养宠物吗？',
    type: 'single',
    options: ['没有也不考虑养', '没有但未来想养', '目前有猫/狗', '养了其他宠物'],
  },

  // ---- 理想伴侣偏好 ----
  {
    id: 'appearance_pref', dimension: 'preference', dimensionLabel: '💝 对方偏好',
    question: '你认为对象的外表重要吗？',
    type: 'single',
    options: ['完全不在意，有趣的灵魂更重要', '过得去就行', '比较看重第一印象', '希望对方注重外表'],
    hint: '这只是偏好，不影响匹配资格',
  },
  {
    id: 'height_pref', dimension: 'preference', dimensionLabel: '💝 对方偏好',
    question: '你对对象的身高有偏好吗？（可多选）',
    type: 'multi',
    options: ['无所谓', '希望对方比自己高', '希望对方和自己差不多高', '希望对方比自己矮', '希望对方比较娇小', '希望对方比较高'],
  },
  {
    id: 'partner_exercise', dimension: 'preference', dimensionLabel: '💝 对方偏好',
    question: '你希望对象也爱运动吗？',
    type: 'single',
    options: ['希望对方也爱运动', '不强求，有共同爱好就行', '完全不在意'],
  },
  {
    id: 'top_quality', dimension: 'preference', dimensionLabel: '💝 对方偏好',
    question: '你认为伴侣最应该具备的品质是？',
    type: 'single',
    options: ['上进心/事业心', '情绪稳定/性格好', '幽默感', '责任感/靠谱', '颜值/外表', '真诚/坦诚'],
    hint: '这是你在对方身上最看重的特质',
  },
  {
    id: 'jealousy_level', dimension: 'preference', dimensionLabel: '💝 对方偏好',
    question: '你对感情的占有欲程度是？',
    type: 'single',
    options: ['完全信任，不看手机', '偶尔想看', '有适度占有欲', '希望对方多报备'],
  },

  // ---- 附加信息 ----
  {
    id: 'height', dimension: 'preference', dimensionLabel: '💝 对方偏好',
    question: '你的身高大概在哪个区间？',
    type: 'single',
    options: ['160以下', '160-165', '165-170', '170-175', '175-180', '180-185', '185以上', '不想透露'],
  },
  {
    id: 'body_type', dimension: 'preference', dimensionLabel: '💝 对方偏好',
    question: '你的体型是？',
    type: 'single',
    options: ['偏瘦', '标准/正常', '偏壮/微胖', '健壮/肌肉型', '不想透露'],
  },
]

const TOTAL_QUESTIONS = QUESTIONS.length

// 维度中文标签
const DIMENSION_DISPLAY: Record<string, { icon: string; color: string; bg: string }> = {
  love_attitude: { icon: '💕', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  values: { icon: '🎯', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  lifestyle: { icon: '🌙', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  personality: { icon: '🧠', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  social: { icon: '🤝', color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
  relationship_goal: { icon: '💍', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200' },
  hobby: { icon: '🎨', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
  preference: { icon: '💝', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
}

export function QuestionnairePage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const question = QUESTIONS[current]
  const isMulti = question.type === 'multi'

  // 加载草稿
  useEffect(() => {
    if (!session?.user?.id) return
    questionnaireApi.getDraft()
      .then(r => {
        if (r.answers && Object.keys(r.answers).length > 0) {
          const filtered: Record<string, string | string[]> = {}
          for (const [k, v] of Object.entries(r.answers)) {
            if (k !== '_submitted') filtered[k] = v
          }
          setAnswers(filtered)
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [session?.user?.id])

  const answeredCount = Object.keys(answers).filter(k => {
    const v = answers[k]
    return Array.isArray(v) ? v.length > 0 : !!v
  }).length

  const progress = Math.round((answeredCount / TOTAL_QUESTIONS) * 100)

  // 切换题目时自动保存
  const goTo = async (idx: number) => {
    if (idx < 0 || idx >= QUESTIONS.length) return
    setCurrent(idx)
    await saveDraft()
  }

  const saveDraft = async () => {
    if (!session?.user?.id) return
    setSaving(true)
    try {
      await questionnaireApi.save(answers)
    } catch {}
    setSaving(false)
  }

  const handleSingleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: option }))
  }

  const handleMultiToggle = (option: string) => {
    setAnswers(prev => {
      const current = (prev[question.id] as string[]) ?? []
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option]
      return { ...prev, [question.id]: updated }
    })
  }

  const isOptionSelected = (option: string) => {
    if (isMulti) {
      return ((answers[question.id] as string[]) ?? []).includes(option)
    }
    return answers[question.id] === option
  }

  const canPrev = current > 0
  const canNext = current < QUESTIONS.length - 1
  const currentAnswered = isOptionSelected(QUESTIONS[current]?.options?.[0] ?? '') ||
    (isMulti ? ((answers[question.id] as string[])?.length ?? 0) > 0 : !!answers[question.id])

  const handleSubmit = async () => {
    // 先保存
    await saveDraft()
    setSubmitting(true)
    try {
      await questionnaireApi.save(answers)
      navigate('/match')
    } catch (e: unknown) {
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-muted">加载中...</div>
      </div>
    )
  }

  // 提交后页面
  if ((answers as Record<string, unknown>)['_submitted']) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-text-primary mb-3">问卷已提交</h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            感谢你的认真填写！你的答案将帮助我们找到与你最契合的伙伴。
            <br />期待你的匹配结果 💕
          </p>
          <button
            onClick={() => navigate('/match')}
            className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            去匹配大厅看看
          </button>
        </div>
      </div>
    )
  }

  const dimInfo = DIMENSION_DISPLAY[question.dimension] ?? { icon: '📝', color: 'text-gray-600', bg: 'bg-gray-50' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-indigo-50">
      {/* 顶部进度条 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-text-secondary">
              {answeredCount}/{TOTAL_QUESTIONS} 题已答
            </span>
            <span className="text-xs text-text-muted ml-auto">{progress}%</span>
            {saving && <span className="text-xs text-text-muted animate-pulse">保存中...</span>}
          </div>
          <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 维度标签 */}
        <div className="flex items-center gap-2 mb-6">
          <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border', dimInfo.bg, dimInfo.color)}>
            <span>{dimInfo.icon}</span>
            <span>{question.dimensionLabel}</span>
          </span>
          {isMulti && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-600 border border-amber-200 font-medium">
              <Check className="w-3 h-3" />
              可多选
            </span>
          )}
        </div>

        {/* 题目卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-6 md:p-8 mb-6">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-2 leading-snug">
            {current + 1}. {question.question}
          </h2>
          {question.hint && (
            <p className="text-sm text-text-muted mb-5">{question.hint}</p>
          )}

          <div className="space-y-2.5">
            {question.options.map((option) => {
              const selected = isOptionSelected(option)
              return (
                <button
                  key={option}
                  onClick={() => isMulti ? handleMultiToggle(option) : handleSingleSelect(option)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium',
                    selected
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-border/80 bg-white text-text-primary hover:border-primary/40 hover:bg-primary/2',
                    isMulti && selected && 'pl-4'
                  )}
                >
                  {isMulti ? (
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        selected ? 'bg-primary border-primary' : 'border-border'
                      )}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        selected ? 'bg-primary border-primary' : 'border-border'
                      )}>
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => goTo(current - 1)}
            disabled={!canPrev}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              canPrev ? 'border-border/80 text-text-secondary hover:bg-border/40' : 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            上一题
          </button>

          {/* 题号导航 */}
          <div className="flex-1 flex items-center justify-center gap-1 flex-wrap">
            {QUESTIONS.map((q, i) => {
              const answered = Object.keys(answers).some(k => {
                const v = answers[k]
                return k === q.id && (Array.isArray(v) ? v.length > 0 : !!v)
              })
              const currentQ = i === current
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  className={cn(
                    'w-5 h-5 rounded text-xs font-medium transition-all',
                    currentQ ? 'bg-primary text-white scale-110' : answered ? 'bg-emerald-100 text-emerald-700' : 'bg-border/40 text-text-muted'
                  )}
                />
              )
            })}
          </div>

          {canNext ? (
            <button
              onClick={() => goTo(current + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/80 text-sm font-medium text-text-secondary hover:bg-border/40 transition-colors"
            >
              下一题
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? '提交中...' : '提交问卷'}
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 leading-relaxed">
            💡 问卷共 {TOTAL_QUESTIONS} 道题，已答 {answeredCount} 道。答案会自动保存，关闭后再次进入可继续填写。
          </p>
        </div>
      </div>
    </div>
  )
}
