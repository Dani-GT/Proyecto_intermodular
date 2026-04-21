require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const porTitulo = [
    { match: 'CB Granollers arranca la temporada',         imagen: '/images/saludo.webp' },
    { match: 'resumen de la primera vuelta',               imagen: '/images/sub14anotando.webp' },
    { match: 'puertas abiertas',                           imagen: '/images/family.webp' },
    { match: 'Nuevas instalaciones en el campo',           imagen: '/images/mantenimiento.webp' },
    { match: 'senior lidera la clasificación',             imagen: '/images/pitcher.webp' },
    { match: 'Sub18 se proclama',                          imagen: '/images/suporters.webp' },
  ];

  const porFecha = [
    { fecha: '2024-05-20', imagen: '/images/aficion.webp' },
    { fecha: '2024-09-10', imagen: '/images/sub18.webp' },
    { fecha: '2025-10-18', imagen: '/images/formacion.webp' },
    { fecha: '2024-12-01', imagen: '/images/banch.webp' },
  ];

  console.log('\n── Por título ──────────────────────────────');
  for (const u of porTitulo) {
    const r = await prisma.noticia.updateMany({
      where: { titulo: { contains: u.match, mode: 'insensitive' } },
      data:  { imagen: u.imagen },
    });
    console.log(r.count ? `✅  ${u.imagen}` : `❌  No encontrada: "${u.match}"`);
  }

  console.log('\n── Por fecha ───────────────────────────────');
  for (const u of porFecha) {
    const desde = new Date(u.fecha + 'T00:00:00Z');
    const hasta = new Date(u.fecha + 'T23:59:59Z');
    const r = await prisma.noticia.updateMany({
      where: { publicadoEn: { gte: desde, lte: hasta } },
      data:  { imagen: u.imagen },
    });
    console.log(r.count ? `✅  ${u.fecha} → ${u.imagen}` : `❌  No encontrada: ${u.fecha}`);
  }
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
