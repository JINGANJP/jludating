/**
 * JLUDating 智能匹配引擎 v2
 * ============================================================
 * 算法核心：加权多维度相似度 + Jaccard 多选题兼容
 * 改进点 v2：
 *   - 多选题使用 Jaccard 相似度（共同选项 / 并集选项）
 *   - 题目分组更精细（7 个维度 → 10 个维度）
 *   - 价值观维度和恋爱观权重最高
 * ============================================================
 */

// ============ 维度权重配置 ============
// 维度权重越高，该维度对最终分数影响越大
// 权重范围: 0.3 (低/加分项) ~ 3.0 (核心/否决项)
const DIMENSION_WEIGHTS: Record<string, number> = {
  // ---- 核心否决维度（权重最高，双方差异过大会直接降低体验）
  love_attitude: 3.0,   // 恋爱态度：认真恋爱 vs 随便试试
  values: 2.5,          // 价值观：金钱观、家庭观、人生规划
  lifestyle: 2.2,       // 生活方式：作息、饮食、消费习惯

  // ---- 重要匹配维度（权重中高，影响长期相处）
  personality: 1.8,     // 人格特质：内外向、情绪处理、决策风格
  social: 1.5,          // 社交风格：朋友圈、社交频率、独处需求
  relationship_goal: 1.5, // 关系目标：结婚/认真交往/先看看

  // ---- 次要加分维度（共同话题、兴趣共鸣）
  hobby: 1.0,           // 兴趣爱好：运动、音乐、阅读、旅行、美食
  preference: 0.8,     // 对方偏好：外表、身高、学历要求

  // ---- 独立加分项（不影响核心匹配）
  mbti_compat: 0.3,    // MBTI 兼容性（仅作参考加分）
}

// ============ 题目配置 ============
interface QuestionConfig {
  dimension: string
  type: 'single' | 'multi' | 'scale' | 'text'
  options?: string[]
  reverse?: boolean   // true = 选项越靠后分数越低
  weight?: number     // 题级权重（默认 1.0）
}

const QUESTION_CONFIGS: Record<string, QuestionConfig> = {

  // ========== 一、恋爱态度（最核心）============
  // Q1: 参与目的
  participate_purpose: {
    dimension: 'love_attitude', type: 'single',
    options: [
      '认真想谈恋爱，找到合适的ta',
      '扩展社交圈，认识有趣的人',
      '体验一下，不确定会不会认真',
      '朋友推荐，好奇试试看',
    ],
    weight: 2.0,
  },
  // Q2: 空窗期
  relationship_exp: {
    dimension: 'love_attitude', type: 'single',
    options: ['母胎 solo，从未恋爱过', '有过 1 段经历', '有过 2-3 段', '3 段以上'],
    weight: 0.5,
  },
  // Q3: 单身多久
  single_duration: {
    dimension: 'love_attitude', type: 'single',
    options: ['不到 3 个月', '3 个月～1 年', '1～2 年', '2 年以上'],
  },
  // Q4: 想谈恋爱的心情多强烈（1-5）
  desire_level: {
    dimension: 'love_attitude', type: 'single',
    options: ['不强，顺其自然', '有一点期待', '比较想谈恋爱', '非常想！已经在积极寻找'],
    weight: 1.5,
  },
  // Q5: 能接受闪婚吗
  quick_marriage: {
    dimension: 'love_attitude', type: 'single',
    options: ['完全不考虑', '认识 3 个月后可以考虑', '认识半年后可以考虑', '遇到对的人，时间不是问题'],
  },

  // ========== 二、价值观 ==========
  // Q6: 消费观
  money_style: {
    dimension: 'values', type: 'single',
    options: ['月光，想花就花', '存一点花一点', '有储蓄计划，理性消费', '有投资理财习惯'],
  },
  // Q7: 为对象花钱的态度
  spending_on_partner: {
    dimension: 'values', type: 'single',
    options: ['学生党，能省则省', '偶尔愿意为对方花大钱', '觉得应该礼尚往来', '愿意为喜欢的人付出'],
  },
  // Q8: 家庭观
  family_value: {
    dimension: 'values', type: 'single',
    options: ['父母最重要，尽量和父母同住', '保持一碗汤的距离最好', '独立生活为主，常回家看看', '家庭和工作平衡即可'],
  },
  // Q9: 学历观
  education_value: {
    dimension: 'values', type: 'single',
    options: ['必须985/211', '本科及以上就够了', '学历不重要，能力更重要', '学校只是人生一小部分'],
  },
  // Q10: 人生优先级
  life_priority: {
    dimension: 'values', type: 'single',
    options: ['学业/事业第一，感情随缘', '找到合适的人一起奋斗', '学业事业和感情都很重要', '享受当下最重要'],
  },
  // Q11: 未来城市
  city_preference: {
    dimension: 'values', type: 'single',
    options: ['长春 / 吉林省内', '优先东北地区', '可以接受全国范围内', '想去更大的城市闯荡'],
  },
  // Q12: 规划能力
  plan_style: {
    dimension: 'values', type: 'single',
    options: ['走一步看一步，随遇而安', '有大致方向但不细化', '有短期规划（1年内）', '有清晰的长期人生规划'],
  },

  // ========== 三、生活方式 ==========
  // Q13: 作息类型
  sleep_type: {
    dimension: 'lifestyle', type: 'single',
    options: ['早睡早起型（22:00前睡）', '正常作息（22-24点睡）', '晚睡晚起型（0点后睡）', '不规律，看情况'],
    weight: 1.5,
  },
  // Q14: 起床心情
  morning_mood: {
    dimension: 'lifestyle', type: 'single',
    options: ['元气满满，很快清醒', '需要10分钟缓冲', '起床困难户，闹钟轰炸', '看睡眠质量'],
  },
  // Q15: 午睡习惯
  nap_habit: {
    dimension: 'lifestyle', type: 'single',
    options: ['每天必须午睡', '偶尔午睡', '从不午睡', '看情况'],
  },
  // Q16: 运动频率
  exercise_freq: {
    dimension: 'lifestyle', type: 'single',
    options: ['几乎不运动', '每周 1-2 次', '每周 3-4 次', '每周 5 次以上/每天'],
    weight: 0.8,
  },
  // Q17: 运动类型（多选）
  exercise_type: {
    dimension: 'hobby', type: 'multi',
    options: ['跑步/快走', '游泳', '健身/力量训练', '篮球/足球/排球', '羽毛球/乒乓球', '瑜伽/普拉提/冥想', '骑行', '爬山/徒步', '舞蹈', '其他'],
    weight: 1.0,
  },
  // Q18: 饮食习惯
  diet_pref: {
    dimension: 'lifestyle', type: 'single',
    options: ['无辣不欢，重口味', '清淡为主', '什么都吃，不挑', '偏爱甜食/西餐'],
  },
  // Q19: 做饭频率
  cooking_freq: {
    dimension: 'lifestyle', type: 'single',
    options: ['从不做饭，外卖为主', '偶尔下厨', '经常自己做饭', '热爱烹饪，会研究菜谱'],
  },
  // Q20: 咖啡/茶依赖
  caffeine: {
    dimension: 'lifestyle', type: 'single',
    options: ['完全不需要', '偶尔一杯提神', '每天至少一杯', '咖啡因重度依赖'],
  },
  // Q21: 周末活动（多选）
  weekend_activity: {
    dimension: 'hobby', type: 'multi',
    options: ['宅家休息/追剧/打游戏', '和朋友聚会/社交', '户外运动/健身', '学习/看书/考证', '逛街/购物/美食探店', '旅行/短途出游', '兼职/实习/工作'],
    weight: 1.2,
  },
  // Q22: 短中期目标
  short_term_goal: {
    dimension: 'values', type: 'single',
    options: ['专注学业/考研/保研', '找一份好实习/工作', '发展兴趣爱好', '搞钱/经济独立', '谈一场认真的恋爱'],
  },

  // ========== 四、人格特质 ==========
  // Q23: 内外向
  personality_type: {
    dimension: 'personality', type: 'single',
    options: ['非常内向，享受独处', '偏内向，但熟人面前很活跃', '偏外向，喜欢社交', '非常外向，人来疯'],
    weight: 1.2,
  },
  // Q24: 情绪处理
  emotion_handle: {
    dimension: 'personality', type: 'single',
    options: ['自己消化，不愿意说', '和朋友倾诉', '直接表达情绪', '写日记/运动/转移注意力'],
  },
  // Q25: 争吵后处理
  fight_after: {
    dimension: 'personality', type: 'single',
    options: ['冷静下来主动道歉', '需要对方先道歉', '吵完就忘了', '会冷战一阵子'],
    weight: 1.5,
  },
  // Q26: 冷战习惯
  cold_war: {
    dimension: 'personality', type: 'single',
    options: ['从不冷战，有话直说', '偶尔冷战，很快就结束', '冷战是我的惯用方式', '视情况而定'],
  },
  // Q27: 决策风格
  decision_style: {
    dimension: 'personality', type: 'single',
    options: ['果断快速，不犹豫', '权衡利弊后决定', '经常犹豫不决', '视问题大小而定'],
  },
  // Q28: 时间观念
  time_punctuality: {
    dimension: 'personality', type: 'single',
    options: ['总是迟到，已习惯', '基本准时，偶尔小迟到', '非常准时，提前到', '看心情看场合'],
  },
  // Q29: MBTI（可选）
  mbti_type: {
    dimension: 'mbti_compat', type: 'single',
    options: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', '不太了解/不想填'],
  },

  // ========== 五、社交风格 ==========
  // Q30: 社交频率
  social_style: {
    dimension: 'social', type: 'single',
    options: ['独来独往，不需要太多社交', '少数几个知心好友足够', '有稳定的社交圈', '朋友很多，社交达人'],
    weight: 1.0,
  },
  // Q31: 朋友圈质量
  friend_quality: {
    dimension: 'social', type: 'single',
    options: ['宁缺毋滥，质量优先', '有几个真心朋友', '朋友圈比较大', '朋友遍天下'],
  },
  // Q32: 朋友圈重合度
  friend_overlap: {
    dimension: 'social', type: 'single',
    options: ['不希望重合，私人空间很重要', '有少量重合最好', '朋友圈完全重合也 OK', '希望认识对方的朋友'],
  },
  // Q33: 社交媒体活跃度
  social_media: {
    dimension: 'social', type: 'single',
    options: ['基本不发朋友圈', '偶尔分享生活', '经常发朋友圈/小红书', '社交媒体重度用户'],
  },
  // Q34: 独处需求
  alone_need: {
    dimension: 'social', type: 'single',
    options: ['每天都需要独处时间', '偶尔需要独处', '大部分时间喜欢有人陪', '完全不需要独处'],
  },

  // ========== 六、关系目标 ==========
  // Q35: 这次最想要什么
  relationshipGoal: {
    dimension: 'relationship_goal', type: 'single',
    options: ['以结婚为前提，认真交往', '认真谈恋爱，不设限终点', '先相处看看，顺其自然', '先做朋友，再看发展'],
    weight: 2.0,
  },
  // Q36: 关系节奏偏好
  relationship_pace: {
    dimension: 'relationship_goal', type: 'single',
    options: ['慢慢来，深入了解再说', '正常节奏', '希望尽快确认关系', '希望在 1 个月内确定关系'],
    weight: 1.2,
  },
  // Q37: 对前任的态度
  ex_handling: {
    dimension: 'relationship_goal', type: 'single',
    options: ['完全不介意，那是过去', '偶尔提及能理解', '希望没有前任联系', '希望了解更多后再判断'],
  },
  // Q38: 异地恋接受度
  long_dist: {
    dimension: 'relationship_goal', type: 'single',
    options: ['完全不接受异地', '短期异地可以（<6个月）', '中长期异地可以（6个月-2年）', '距离不是问题'],
  },
  // Q39: 对前任公开度
  ex_public: {
    dimension: 'relationship_goal', type: 'single',
    options: ['完全不公开前任信息', '知道有过前任就行', '可以偶尔提起', '可以大方讨论'],
  },

  // ========== 七、兴趣爱好（加分项）============
  // Q40: 兴趣爱好（多选）
  hobby_interest: {
    dimension: 'hobby', type: 'multi',
    options: ['阅读/文学', '电影/追剧', '音乐/乐器', '旅行/户外', '美食/探店', '游戏/电竞', '运动健身', '摄影/短视频', '动漫/二次元', '科技/数码', '绘画/艺术', '养宠物', '其他'],
    weight: 1.5,
  },
  // Q41: 阅读偏好
  reading: {
    dimension: 'hobby', type: 'single',
    options: ['几乎不读', '偶尔翻翻', '经常阅读（非专业书籍）', '深度阅读爱好者'],
  },
  // Q42: 电影类型（多选）
  movie_type: {
    dimension: 'hobby', type: 'multi',
    options: ['爱情片', '科幻/奇幻', '悬疑/推理', '喜剧', '动作/超级英雄', '纪录片', '日韩剧', '国产剧', '欧美剧', '动漫'],
  },
  // Q43: 音乐类型（多选）
  music_type: {
    dimension: 'hobby', type: 'multi',
    options: ['流行音乐', '摇滚', '民谣', '说唱/HipHop', '古典/交响乐', '电子/EDM', 'R&B/Soul', 'ACG/动漫音乐', '轻音乐/纯音乐'],
  },
  // Q44: 旅行偏好
  travel: {
    dimension: 'hobby', type: 'single',
    options: ['很少出行', '偶尔周边游', '经常旅行，探索新地方', '旅行达人，喜欢深度游'],
    weight: 0.8,
  },
  // Q45: 养宠物
  pet: {
    dimension: 'hobby', type: 'single',
    options: ['没有也不考虑养', '没有但未来想养', '目前有猫/狗', '养了其他宠物'],
  },

  // ========== 八、理想伴侣偏好（权重较低，仅作参考）============
  // Q46: 对方外表重要程度
  appearance_pref: {
    dimension: 'preference', type: 'single',
    options: ['完全不在意，有趣的灵魂更重要', '过得去就行', '比较看重第一印象', '希望对方注重外表'],
  },
  // Q47: 对方身高偏好（多选）
  height_pref: {
    dimension: 'preference', type: 'multi',
    options: ['无所谓', '希望对方比自己高', '希望对方和自己差不多高', '希望对方比自己矮', '希望对方比较娇小', '希望对方比较高'],
  },
  // Q48: 对运动的看法
  partner_exercise: {
    dimension: 'preference', type: 'single',
    options: ['希望对方也爱运动', '不强求，有共同爱好就行', '完全不在意'],
  },
  // Q49: 最看重对方什么
  top_quality: {
    dimension: 'preference', type: 'single',
    options: ['上进心/事业心', '情绪稳定/性格好', '幽默感', '责任感/靠谱', '颜值/外表', '真诚/坦诚'],
    weight: 1.5,
  },
  // Q50: 对对象的独占欲
  jealousy_level: {
    dimension: 'preference', type: 'single',
    options: ['完全信任，不看手机', '偶尔想看', '有适度占有欲', '希望对方多报备'],
  },

  // ========== 九、附加信息（不影响匹配）============
  // Q51: 身高
  height: {
    dimension: 'preference', type: 'single',
    options: ['160以下', '160-165', '165-170', '170-175', '175-180', '180-185', '185以上', '不想透露'],
  },
  // Q52: 体型
  body_type: {
    dimension: 'preference', type: 'single',
    options: ['偏瘦', '标准/正常', '偏壮/微胖', '健壮/肌肉型', '不想透露'],
  },
}

// 题目总数（不含 _submitted）
export const QUESTION_COUNT = Object.keys(QUESTION_CONFIGS).length

// ============ 归一化函数 ============
function normalizeSingle(config: QuestionConfig, answer: string): number | null {
  if (!config.options) return null
  const idx = config.options.indexOf(answer.trim())
  if (idx === -1) return null
  const normalized = idx / (config.options.length - 1)
  return config.reverse ? 1 - normalized : normalized
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1.0  // 两个空集视为相同
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

function normalizeMulti(config: QuestionConfig, answer: string | string[] | null | undefined): number | null {
  const arr = Array.isArray(answer) ? answer : (answer ? [answer] : [])
  if (!config.options) return null
  const validOptions = config.options
  const validAnswers = arr.filter(a => validOptions.includes(a.trim())).map(a => a.trim())
  if (validAnswers.length === 0) return null
  // 对于 normalizeMulti 我们只返回题级 flag，实际多选相似度在 dimensionSimilarity 里计算
  return validAnswers.length / validOptions.length  // 归一化为参与度（0-1）
}

/**
 * 答案归一化
 */
function normalizeAnswer(questionId: string, answer: string | string[] | null | undefined): number | null {
  if (answer === null || answer === undefined || answer === '') return null
  if (Array.isArray(answer)) {
    if (answer.length === 0) return null
  }
  const config = QUESTION_CONFIGS[questionId]
  if (!config) return null
  if (config.type === 'single') {
    return normalizeSingle(config, Array.isArray(answer) ? answer[0] ?? '' : answer)
  }
  if (config.type === 'multi') {
    return normalizeMulti(config, answer)
  }
  return null
}

/**
 * 获取原始答案用于 Jaccard 计算（多选题）
 */
function getRawMultiAnswers(answer: string | string[] | null | undefined): string[] {
  if (!answer) return []
  if (Array.isArray(answer)) return answer.map(a => a.trim()).filter(Boolean)
  return [answer.trim()]
}

// ============ MBTI 兼容性计算 ============
function mbtiCompatibility(mbtiA: string, mbtiB: string): number {
  if (mbtiA === '不太了解/不想填' || mbtiB === '不太了解/不想填') return 0.5

  // 互补型配对加分
  const compat: Record<string, string[]> = {
    'INTJ': ['ENFP', 'ENTP', 'INTP'],
    'INTP': ['ENTJ', 'ENFJ', 'INTJ'],
    'ENTJ': ['INTP', 'ENTP', 'INTJ'],
    'ENTP': ['INTJ', 'ENTJ', 'INFJ'],
    'INFJ': ['ENFP', 'ENTP', 'INTP'],
    'INFP': ['ENFJ', 'ENTJ', 'INFJ'],
    'ENFJ': ['INFP', 'ISFP', 'INTP'],
    'ENFP': ['INTJ', 'INFJ', 'INFP'],
    'ISTJ': ['ESFP', 'ENFP', 'ESTJ'],
    'ISFJ': ['ESFP', 'ENFP', 'ESTP'],
    'ESTJ': ['ISTP', 'ISFP', 'ISTJ'],
    'ESFJ': ['ISTP', 'ISFP', 'ESTP'],
    'ISTP': ['ESFJ', 'ESTJ', 'ISFP'],
    'ISFP': ['ENFJ', 'ESFJ', 'ISTP'],
    'ESTP': ['ISFJ', 'ISTJ', 'ESFJ'],
    'ESFP': ['ISFJ', 'ISTJ', 'INFJ'],
  }
  const groupA = compat[mbtiA] ?? []
  return groupA.includes(mbtiB) ? 1.0 : 0.5
}

// ============ 维度相似度计算 ============
function dimensionSimilarity(
  userA_answers: Record<string, string | string[]>,
  userB_answers: Record<string, string | string[]>,
): { dimension: string; score: number; count: number }[] {
  const dimensionScores: Record<string, { total: number; count: number }> = {}
  const dimensionMultiQ: Record<string, { qId: string; config: QuestionConfig }[]> = {}

  for (const [qId, config] of Object.entries(QUESTION_CONFIGS)) {
    if (!dimensionMultiQ[config.dimension]) {
      dimensionMultiQ[config.dimension] = []
    }
    dimensionMultiQ[config.dimension].push({ qId, config })
  }

  for (const [dim, questions] of Object.entries(dimensionMultiQ)) {
    let dimTotal = 0
    let dimCount = 0

    for (const { qId, config } of questions) {
      if (config.type === 'multi') {
        // 多选题用 Jaccard
        const arrA = getRawMultiAnswers(userA_answers[qId])
        const arrB = getRawMultiAnswers(userB_answers[qId])
        if (arrA.length === 0 && arrB.length === 0) continue  // 都未作答，跳过
        const sim = jaccardSimilarity(arrA, arrB)
        const weight = config.weight ?? 1.0
        dimTotal += sim * weight
        dimCount += weight
      } else {
        // 单选题用曼哈顿距离转相似度
        const normA = normalizeAnswer(qId, userA_answers[qId])
        const normB = normalizeAnswer(qId, userB_answers[qId])
        if (normA === null || normB === null) continue
        const diff = Math.abs(normA - normB)
        const sim = 1 - diff
        const weight = config.weight ?? 1.0
        dimTotal += sim * weight
        dimCount += weight
      }
    }

    if (dimCount > 0) {
      if (!dimensionScores[dim]) dimensionScores[dim] = { total: 0, count: 0 }
      dimensionScores[dim].total += dimTotal
      dimensionScores[dim].count += dimCount
    }
  }

  return Object.entries(dimensionScores).map(([dim, data]) => ({
    dimension: dim,
    score: data.count > 0 ? data.total / data.count : 0,
    count: Math.round(data.count),
  }))
}

// ============ 维度中文名称映射 ============
export const DIMENSION_LABELS: Record<string, string> = {
  love_attitude: '恋爱态度',
  values: '价值观',
  lifestyle: '生活方式',
  personality: '人格特质',
  social: '社交风格',
  relationship_goal: '关系目标',
  hobby: '兴趣爱好',
  preference: '对方偏好',
  mbti_compat: 'MBTI 契合',
}

// ============ 维度颜色映射 ============
export const DIMENSION_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  love_attitude: { bg: 'bg-rose-50', text: 'text-rose-600', bar: 'bg-rose-500' },
  values: { bg: 'bg-violet-50', text: 'text-violet-600', bar: 'bg-violet-500' },
  lifestyle: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  personality: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
  social: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
  relationship_goal: { bg: 'bg-pink-50', text: 'text-pink-600', bar: 'bg-pink-500' },
  hobby: { bg: 'bg-teal-50', text: 'text-teal-600', bar: 'bg-teal-500' },
  preference: { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
  mbti_compat: { bg: 'bg-sky-50', text: 'text-sky-600', bar: 'bg-sky-500' },
}

/**
 * 计算综合匹配分数 (0-100)
 */
export function calculateCompatibilityScore(
  userA_answers: Record<string, string | string[]>,
  userB_answers: Record<string, string | string[]>
): {
  totalScore: number
  dimensionBreakdown: Record<string, number>
  dimensionDetails: Array<{ dimension: string; score: number; label: string }>
} {
  const dimResults = dimensionSimilarity(userA_answers, userB_answers)

  let weightedSum = 0
  let totalWeight = 0
  const breakdown: Record<string, number> = {}
  const details: Array<{ dimension: string; score: number; label: string }> = []

  for (const { dimension, score } of dimResults) {
    const weight = DIMENSION_WEIGHTS[dimension] ?? 1.0
    weightedSum += score * weight
    totalWeight += weight
    breakdown[dimension] = Math.round(score * 100)
    details.push({ dimension, score: Math.round(score * 100), label: DIMENSION_LABELS[dimension] ?? dimension })
  }

  const totalScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0
  return { totalScore, dimensionBreakdown: breakdown, dimensionDetails: details }
}

/**
 * 计算 MBTI 兼容性分数
 */
export function calculateMbtiScore(mbtiA: string | null, mbtiB: string | null): number {
  if (!mbtiA || !mbtiB) return 0
  if (mbtiA === '不太了解/不想填' || mbtiB === '不太了解/不想填') return 0
  return Math.round(mbtiCompatibility(mbtiA, mbtiB) * 100)
}

/**
 * 排名候选用户
 */
export function rankCandidates(
  myAnswers: Record<string, string | string[]>,
  candidates: Array<{ userId: string; answers: Record<string, string | string[]> }>
): Array<{ partnerId: string; score: number; breakdown: Record<string, number> }> {
  return candidates
    .map(c => {
      const { totalScore, dimensionBreakdown } = calculateCompatibilityScore(myAnswers, c.answers)
      return { partnerId: c.userId, score: totalScore, breakdown: dimensionBreakdown }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * 贪心稳定匹配算法
 */
export function greedyStableMatch(
  participants: Array<{ userId: string; answers: Record<string, string | string[]> }>
): Array<{ userAId: string; userBId: string; score: number }> {
  const n = participants.length
  if (n < 2) return []

  const shuffled = [...participants].sort(() => Math.random() - 0.5)
  const rankings: Map<string, Map<string, number>> = new Map()

  for (const p of shuffled) {
    const others = shuffled.filter(o => o.userId !== p.userId)
    const ranked = rankCandidates(p.answers, others)
    const map = new Map<string, number>()
    for (const r of ranked) map.set(r.partnerId, r.score)
    rankings.set(p.userId, map)
  }

  const matched = new Set<string>()
  const pairs: Array<{ userAId: string; userBId: string; score: number }> = []

  for (const p of shuffled) {
    if (matched.has(p.userId)) continue
    const rankMap = rankings.get(p.userId)!
    for (const [candidateId, score] of rankMap) {
      if (!matched.has(candidateId)) {
        matched.add(p.userId)
        matched.add(candidateId)
        pairs.push({ userAId: p.userId, userBId: candidateId, score })
        break
      }
    }
  }

  return pairs
}

// ============ 导出配置 ============
export { DIMENSION_WEIGHTS, QUESTION_CONFIGS }
