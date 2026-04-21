require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const productos = [
    // Merchandising
    { match: 'Taza CB Granollers',                        imagen: '/images/productos/taza.webp' },
    { match: 'Llavero CB Granollers',                     imagen: '/images/productos/llavero.webp' },
    { match: 'Bufanda Jacquard CB Granollers',            imagen: '/images/productos/bufanda.webp' },
    { match: 'Pin Esmaltado CB Granollers',               imagen: '/images/productos/pin.webp' },
    { match: 'Pegatina Pack CB Granollers',               imagen: '/images/productos/pegatinas.webp' },
    // Guantillas
    { match: 'Guantillas de Bateo Senior CB Granollers',  imagen: '/images/productos/guantillassenior.webp' },
    { match: 'Guantillas de Bateo Junior',                imagen: '/images/productos/guantillasjunior.webp' },
    { match: 'Guantillas de Bateo Infantil',              imagen: '/images/productos/guantillainfantil.webp' },
    // Mochilas
    { match: 'Mochila de Béisbol CB Granollers Pro',      imagen: '/images/productos/mochilapro.webp' },
    { match: 'Mochila de Entrenamiento CB Granollers Lite', imagen: '/images/productos/mochilelite.webp' },
  ];

  console.log('\n── Actualizando imágenes de productos ──────────────');
  for (const p of productos) {
    const r = await prisma.producto.updateMany({
      where: { nombre: { contains: p.match, mode: 'insensitive' } },
      data:  { imagen: p.imagen },
    });
    console.log(r.count ? `✅  ${p.imagen}` : `❌  No encontrado: "${p.match}"`);
  }
  console.log('\n¡Listo! Reinicia el servidor para ver los cambios.\n');
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
