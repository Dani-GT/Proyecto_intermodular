require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updates = [
    { match: 'senior lidera',        imagen: '/images/pitcher.webp' },
    { match: 'Nuevas instalaciones', imagen: '/images/battingpractice.webp' },
    { match: 'puertas abiertas',     imagen: '/images/formacion.webp' },
    { match: 'Sub18 se proclama',    imagen: '/images/suporters.webp' },
  ];

  for (const u of updates) {
    const r = await prisma.noticia.updateMany({
      where:  { titulo: { contains: u.match, mode: 'insensitive' } },
      data:   { imagen: u.imagen },
    });
    console.log(r.count ? `✅  ${u.imagen}` : `❌  No encontrada: "${u.match}"`);
  }
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
