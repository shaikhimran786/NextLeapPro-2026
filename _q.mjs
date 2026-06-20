import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const rows = await p.community.findMany({
    select: { id:true, name:true, isPublic:true, logo:true, coverImage:true },
    orderBy: { id: 'asc' }, take: 50,
  });
  for (const r of rows) {
    console.log(`#${r.id} pub=${r.isPublic} | logo=${JSON.stringify(r.logo)} | name=${r.name}`);
  }
  console.log('TOTAL', rows.length);
} catch(e){ console.error('ERR', e.message); } finally { await p.$disconnect(); }
