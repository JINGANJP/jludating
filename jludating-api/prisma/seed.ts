import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://user:pass@localhost:5432/jludating?schema=public',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const whitelists = [
    // 吉林大学
    { domain: 'mails.jlu.edu.cn', university: '吉林大学' },
    { domain: 'jlu.edu.cn', university: '吉林大学' },
    // 东北师范大学
    { domain: 'nenu.edu.cn', university: '东北师范大学' },
    { domain: 'mails.nenu.edu.cn', university: '东北师范大学' },
    // 长春理工大学
    { domain: 'ccut.edu.cn', university: '长春理工大学' },
    { domain: 'mails.ccut.edu.cn', university: '长春理工大学' },
    // 长春工业大学
    { domain: 'jlut.edu.cn', university: '长春工业大学' },
    { domain: 'mails.jlut.edu.cn', university: '长春工业大学' },
    // 长春大学
    { domain: 'ccu.edu.cn', university: '长春大学' },
    { domain: 'mails.ccu.edu.cn', university: '长春大学' },
    // 吉林农业大学
    { domain: 'jlau.edu.cn', university: '吉林农业大学' },
    { domain: 'mails.jlau.edu.cn', university: '吉林农业大学' },
    // 长春中医药大学
    { domain: 'ccatcm.edu.cn', university: '长春中医药大学' },
    { domain: 'mails.ccatcm.edu.cn', university: '长春中医药大学' },
    // 吉林财经大学
    { domain: 'jlufe.edu.cn', university: '吉林财经大学' },
    { domain: 'mails.jlufe.edu.cn', university: '吉林财经大学' },
    // 开发测试用
    { domain: '163.com', university: '通用邮箱（开发测试）' },
  ]

  for (const wl of whitelists) {
    await prisma.emailWhitelist.upsert({
      where: { domain: wl.domain },
      update: { university: wl.university },
      create: wl,
    })
    console.log(`  ✅ Whitelist: ${wl.domain} (${wl.university})`)
  }

  // Seed 一条开放中的匹配轮次（2026年春季学期）
  // 先检查是否有 OPEN 轮次，没有则创建
  const now = new Date()
  const existingOpen = await prisma.matchingRound.findFirst({ where: { status: 'OPEN' } })
  if (!existingOpen) {
    const maxRound = await prisma.matchingRound.findFirst({ orderBy: { roundNumber: 'desc' } })
    const nextNum = (maxRound?.roundNumber ?? 0) + 1
    const round = await prisma.matchingRound.create({
      data: {
        roundNumber: nextNum,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
        status: 'OPEN',
        participantCount: 0,
      },
    })
    console.log(`  ✅ Created MatchingRound: 第 ${round.roundNumber} 期（${round.status}）`)
  } else {
    console.log(`  ℹ️  Already has OPEN round: 第 ${existingOpen.roundNumber} 期`)
  }

  console.log('✨ Seeding complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
