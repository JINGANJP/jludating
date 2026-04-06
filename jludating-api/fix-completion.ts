require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function fix() {
  const profiles = await prisma.profile.findMany();
  console.log('Found', profiles.length, 'profiles');
  for (const p of profiles) {
    const fields = ['nickname', 'gender', 'grade', 'major', 'department', 'hometown', 'mbti', 'bio'];
    const filled = fields.filter(f => p[f] !== null && p[f] !== '').length;
    const completion = Math.round((filled / fields.length) * 100);
    if (p.profileCompletion !== completion) {
      await prisma.profile.update({ where: { id: p.id }, data: { profileCompletion: completion } });
      console.log('  Updated user', p.userId, '->', completion + '%');
    } else {
      console.log('  Skipping user', p.userId, '(already', completion + '%)');
    }
  }
  await prisma.$disconnect();
  await pool.end();
  console.log('Done');
}

fix().catch(e => { console.error(e); process.exit(1); });
