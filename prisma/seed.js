// ─── Seed de base de datos ─────────────────────────────────────────────────────
// Ejecutar con: npm run db:seed
// Crea: usuario admin, 6 categorías, noticias, productos, partidos de ejemplo
// ──────────────────────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // ─── 1. Categorías ──────────────────────────────────────────────────────────
  console.log('📂 Creando categorías...');
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: 'SUB10' },
      update: {},
      create: {
        nombre: 'SUB10',
        descripcion: 'Categoría benjamín para jugadores de hasta 10 años. El primer contacto con el béisbol, enfocado en el desarrollo motor y el disfrute del juego.',
        entrenador: 'Carlos Martínez',
        horarioEntrenamiento: 'Martes y Jueves 17:00 - 19:00',
      },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'SUB12' },
      update: {},
      create: {
        nombre: 'SUB12',
        descripcion: 'Categoría alevín para jugadores de 11 y 12 años. Se introducen conceptos tácticos básicos y se trabaja la técnica individual.',
        entrenador: 'Laura Pérez',
        horarioEntrenamiento: 'Lunes y Miércoles 17:30 - 19:30',
      },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'SUB14' },
      update: {},
      create: {
        nombre: 'SUB14',
        descripcion: 'Categoría infantil para jugadores de 13 y 14 años. Mayor énfasis en la competición y el desarrollo técnico-táctico.',
        entrenador: 'Marc Torres',
        horarioEntrenamiento: 'Martes y Viernes 18:00 - 20:00',
      },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'SUB16' },
      update: {},
      create: {
        nombre: 'SUB16',
        descripcion: 'Categoría cadete para jugadores de 15 y 16 años. Preparación para la competición regional y desarrollo físico específico.',
        entrenador: 'David Sánchez',
        horarioEntrenamiento: 'Lunes, Miércoles y Viernes 18:30 - 21:00',
      },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'SUB18' },
      update: {},
      create: {
        nombre: 'SUB18',
        descripcion: 'Categoría juvenil para jugadores de 17 y 18 años. Alta intensidad competitiva, preparación para el salto al equipo senior.',
        entrenador: 'Àlex Ribera',
        horarioEntrenamiento: 'Martes, Jueves y Sábado 19:00 - 21:30',
      },
    }),
    prisma.categoria.upsert({
      where: { nombre: 'SENIOR' },
      update: {},
      create: {
        nombre: 'SENIOR',
        descripcion: 'Equipo principal del club. Compite en la División de Honor de béisbol catalán y representa al club en competiciones nacionales.',
        entrenador: 'Roberto Fuentes',
        horarioEntrenamiento: 'Lunes, Miércoles y Viernes 20:00 - 22:30',
      },
    }),
  ]);
  console.log(`   ✅ ${categorias.length} categorías creadas\n`);

  // ─── 2. Usuario admin ───────────────────────────────────────────────────────
  console.log('👤 Creando usuario admin...');
  const hashAdmin = await bcrypt.hash('Admin1234!', 10);
  const admin = await prisma.persona.upsert({
    where: { email: 'admin@cbgranollers.cat' },
    update: {},
    create: {
      nombre: 'Admin',
      apellidos: 'CB Granollers',
      email: 'admin@cbgranollers.cat',
      password: hashAdmin,
      telefono: '938000001',
      fechaNacimiento: new Date('1990-01-01'),
      rol: {
        create: { tipo: 'ADMIN' },
      },
    },
  });
  console.log(`   ✅ Admin: admin@cbgranollers.cat / Admin1234!\n`);

  // ─── 3. Usuario socio de ejemplo ────────────────────────────────────────────
  console.log('👥 Creando usuarios de ejemplo...');
  const hashUser = await bcrypt.hash('User1234!', 10);
  await prisma.persona.upsert({
    where: { email: 'socio@ejemplo.com' },
    update: {},
    create: {
      nombre: 'Joan',
      apellidos: 'Garcia Puig',
      email: 'socio@ejemplo.com',
      password: hashUser,
      telefono: '600123456',
      fechaNacimiento: new Date('1995-06-15'),
      rol: {
        create: { tipo: 'SOCIO' },
      },
    },
  });
  const jugador = await prisma.persona.upsert({
    where: { email: 'jugador@ejemplo.com' },
    update: {},
    create: {
      nombre: 'Pau',
      apellidos: 'López Serra',
      email: 'jugador@ejemplo.com',
      password: hashUser,
      telefono: '600654321',
      fechaNacimiento: new Date('2005-03-20'),
      rol: {
        create: { tipo: 'JUGADOR' },
      },
    },
  });
  console.log(`   ✅ Usuarios: socio@ejemplo.com y jugador@ejemplo.com (pass: User1234!)\n`);

  // ─── 4. Inscripción de ejemplo ──────────────────────────────────────────────
  console.log('📋 Creando inscripción de ejemplo...');
  const categoriaSub14 = categorias.find(c => c.nombre === 'SUB14');
  const inscripcionExistente = await prisma.inscripcion.findFirst({
    where: { personaId: jugador.id, categoriaId: categoriaSub14.id },
  });
  if (!inscripcionExistente) {
    await prisma.inscripcion.create({
      data: {
        personaId: jugador.id,
        categoriaId: categoriaSub14.id,
        temporada: '2024-2025',
        estado: 'APROBADA',
        notas: 'Inscripción de prueba generada por seed',
      },
    });
  }
  console.log(`   ✅ Inscripción creada para jugador en SUB14\n`);

  // ─── 5. Noticias ────────────────────────────────────────────────────────────
  console.log('📰 Creando noticias...');
  const noticiaData = [
    {
      titulo: 'El CB Granollers arranca la temporada 2024-2025 con grandes expectativas',
      resumen: 'El club granollerí presenta su plantilla más amplia de la historia con 8 equipos en competición.',
      contenido: `El Club Béisbol Granollers ha comenzado oficialmente la temporada 2024-2025 con una presentación de equipos que llenó las instalaciones del campo municipal. Con más de 150 jugadores federados, el club afronta el curso más ambicioso de su historia.\n\nEl equipo senior, dirigido por Roberto Fuentes, aspira al ascenso a la División de Honor nacional, mientras que las categorías base presentan un estado de forma excelente tras una intensa pretemporada.\n\n"Estamos muy ilusionados con lo que hemos preparado este verano. El nivel de compromiso de los jugadores y de las familias es increíble", declaró el presidente del club durante el acto de presentación.\n\nLa temporada comienza el próximo sábado con el primer partido oficial del equipo senior en casa.`,
      publicadoEn: new Date('2024-09-10'),
      autor: 'Redacción CB Granollers',
      destacada: true,
    },
    {
      titulo: 'El equipo Sub18 se proclama campeón del Torneo de Primavera',
      resumen: 'Los jóvenes jugadores granolleríes ganaron el torneo invictos con 5 victorias en 5 partidos.',
      contenido: `El equipo Sub18 del CB Granollers se coronó campeón del XXI Torneo de Primavera disputado en Hospitalet de Llobregat. Los jugadores dirigidos por Àlex Ribera completaron una actuación perfecta ganando los cinco partidos de la competición.\n\nLa final se disputó el domingo por la tarde ante el CB Vilafranca, a quienes vencieron por 8-2 en un partido dominado de principio a fin. El MVP del torneo fue el lanzador Martí Casas, quien completó dos aperturas sin carreras limpias en contra.\n\n"Estos chicos han trabajado muchísimo y se lo merecen. El equipo ha crecido un 100% respecto al año pasado", comentó orgulloso el entrenador Àlex Ribera.\n\nEl trofeo ya está expuesto en la sede del club junto a los demás reconocimientos de la temporada.`,
      publicadoEn: new Date('2024-05-20'),
      autor: 'Redacción CB Granollers',
      destacada: true,
    },
    {
      titulo: 'Nuevas instalaciones en el campo municipal',
      resumen: 'El Ayuntamiento de Granollers invierte en la mejora del campo de béisbol con nuevos vestuarios y tribuna.',
      contenido: `El Ayuntamiento de Granollers ha aprobado una inversión de 120.000 euros para la mejora de las instalaciones del campo municipal de béisbol. Las obras incluyen la construcción de nuevos vestuarios, la ampliación de la tribuna principal y la mejora del sistema de iluminación para entrenamientos nocturnos.\n\n"Es un reconocimiento al trabajo que lleva haciendo el club durante más de 20 años. Granollers se merece unas instalaciones acordes al nivel del béisbol que se practica aquí", declaró la regidora de deportes.\n\nLas obras comenzarán a finales de octubre y se prevé que estén finalizadas antes de la Navidad, a tiempo para la segunda vuelta de la temporada.`,
      publicadoEn: new Date('2024-10-05'),
      autor: 'Redacción CB Granollers',
      destacada: false,
    },
    {
      titulo: 'Jornada de puertas abiertas para niños de 6 a 12 años',
      resumen: 'El próximo sábado el club organiza una jornada de iniciación al béisbol para los más pequeños.',
      contenido: `El CB Granollers organiza una jornada de puertas abiertas el próximo sábado 16 de noviembre de 10:00 a 13:00 horas en el campo municipal. La actividad está dirigida a niños y niñas de entre 6 y 12 años que quieran conocer el béisbol de primera mano.\n\nLos entrenadores del club prepararán juegos y actividades adaptadas a cada edad, y los pequeños podrán batear, lanzar y atrapar en un ambiente divertido y seguro. La entrada es gratuita y no es necesaria inscripción previa.\n\nSi tu hijo o hija tiene curiosidad por este deporte, ¡es la oportunidad perfecta para descubrirlo!`,
      publicadoEn: new Date('2024-11-10'),
      autor: 'Redacción CB Granollers',
      destacada: false,
    },
    {
      titulo: 'Resumen de la primera vuelta: el senior lidera la clasificación',
      resumen: 'Con 7 victorias y 2 derrotas, el equipo senior de Granollers encabeza el grupo A de la División de Honor catalana.',
      contenido: `Tras completar la primera vuelta de la temporada, el equipo senior del CB Granollers lidera la clasificación del Grupo A de la División de Honor de béisbol catalán con 7 victorias y tan solo 2 derrotas.\n\nEl balance es muy positivo para un equipo que hace solo dos temporadas militaba en Primera División. El trabajo de Roberto Fuentes está dando sus frutos y la afición granollerina empieza a soñar con la posibilidad de una clasificación para el campeonato nacional.\n\nDestacados de la primera vuelta: el lanzador Daniel Moreno acumula 45 strikeouts en 6 aperturas, mientras que el campo interior ha cometido solo 3 errores en 9 partidos. Los próximos compromisos serán cruciales para mantener el liderato.`,
      publicadoEn: new Date('2024-12-01'),
      autor: 'Redacción CB Granollers',
      destacada: true,
    },
  ];

  for (const noticia of noticiaData) {
    await prisma.noticia.upsert({
      where: { titulo: noticia.titulo },
      update: {},
      create: noticia,
    });
  }
  console.log(`   ✅ ${noticiaData.length} noticias creadas\n`);

  // ─── 6. Productos ───────────────────────────────────────────────────────────
  console.log('🛍️  Creando productos...');
  const productosData = [
    {
      nombre: 'Camiseta Oficial CB Granollers 2024',
      descripcion: 'Camiseta de juego oficial del Club Béisbol Granollers temporada 2024-2025. Tejido técnico transpirable, disponible en tallas XS a 3XL. Incluye el número personalizable.',
      precio: 39.99,
      stock: 50,
      categoria: 'ROPA',
      imagen: null,
    },
    {
      nombre: 'Gorra Oficial CB Granollers',
      descripcion: 'Gorra snapback oficial con el escudo bordado del club. Talla única ajustable. Disponible en negro con visor rojo.',
      precio: 24.99,
      stock: 80,
      categoria: 'ROPA',
      imagen: null,
    },
    {
      nombre: 'Sudadera Hoodie CB Granollers',
      descripcion: 'Sudadera con capucha y bolsillo canguro. Bordado del escudo en el pecho y lettering "Granollers" en la espalda. 80% algodón, 20% poliéster.',
      precio: 49.99,
      stock: 30,
      categoria: 'ROPA',
      imagen: null,
    },
    {
      nombre: 'Bate de béisbol aluminio iniciación',
      descripcion: 'Bate de aluminio ideal para categorías base (Sub10, Sub12). Longitud 28", peso compensado para facilitar el batazo. Certificado para competición oficial.',
      precio: 59.99,
      stock: 15,
      categoria: 'EQUIPAMIENTO',
      imagen: null,
    },
    {
      nombre: 'Guante de béisbol talla infantil',
      descripcion: 'Guante de cuero sintético para mano izquierda (uso mano derecha). Talla 10.5", perfecto para Sub10 y Sub12. Incluye instrucciones de mantenimiento.',
      precio: 44.99,
      stock: 20,
      categoria: 'EQUIPAMIENTO',
      imagen: null,
    },
    {
      nombre: 'Pelota oficial de béisbol (pack 3)',
      descripcion: 'Pack de 3 pelotas oficiales de béisbol con costuras de cuero. Homologadas para competición federada. Peso 142g, circunferencia 23cm.',
      precio: 18.99,
      stock: 100,
      categoria: 'EQUIPAMIENTO',
      imagen: null,
    },
    {
      nombre: 'Casco de bateo junior',
      descripcion: 'Casco de bateo certificado para categorías infantil y juvenil. Protección doble oído, ventilación optimizada. Tallas S/M y L/XL.',
      precio: 34.99,
      stock: 25,
      categoria: 'EQUIPAMIENTO',
      imagen: null,
    },
    {
      nombre: 'Taza CB Granollers',
      descripcion: 'Taza de cerámica de 330ml con el escudo del club. Apta para microondas y lavavajillas. El regalo perfecto para cualquier fan.',
      precio: 12.99,
      stock: 60,
      categoria: 'MERCHANDISING',
      imagen: null,
    },
    {
      nombre: 'Llavero CB Granollers',
      descripcion: 'Llavero metálico con el escudo esmaltado del club. Acabado en acero inoxidable, resistente y elegante.',
      precio: 7.99,
      stock: 150,
      categoria: 'MERCHANDISING',
      imagen: null,
    },
    {
      nombre: 'Pegatina pack (5 unidades)',
      descripcion: 'Pack de 5 pegatinas con diferentes diseños del CB Granollers. Resistentes al agua, aptas para exterior. Tamaños variados.',
      precio: 4.99,
      stock: 200,
      categoria: 'MERCHANDISING',
      imagen: null,
    },
  ];

  for (const producto of productosData) {
    await prisma.producto.upsert({
      where: { nombre: producto.nombre },
      update: {},
      create: producto,
    });
  }
  console.log(`   ✅ ${productosData.length} productos creados\n`);

  // ─── 7. Partidos ────────────────────────────────────────────────────────────
  console.log('⚾ Creando partidos...');
  const categoriaSenior = categorias.find(c => c.nombre === 'SENIOR');
  const categoriaSub18 = categorias.find(c => c.nombre === 'SUB18');
  const categoriaSub16 = categorias.find(c => c.nombre === 'SUB16');

  const partidosData = [
    // Partidos pasados con resultado
    {
      categoriaId: categoriaSenior.id,
      rival: 'CB Hospitalet',
      fecha: new Date('2024-10-05T11:00:00'),
      esLocal: true,
      campo: 'Campo Municipal Granollers',
      resultado: '7-3',
      descripcion: 'Gran victoria en el primer partido en casa de la temporada.',
    },
    {
      categoriaId: categoriaSenior.id,
      rival: 'CB Vilafranca',
      fecha: new Date('2024-10-12T11:00:00'),
      esLocal: false,
      campo: 'Camp Municipal de Vilafranca',
      resultado: '5-8',
      descripcion: 'Derrota ajustada en el partido más disputado de la jornada.',
    },
    {
      categoriaId: categoriaSub18.id,
      rival: 'CB Sabadell',
      fecha: new Date('2024-10-19T10:00:00'),
      esLocal: true,
      campo: 'Campo Municipal Granollers',
      resultado: '12-4',
      descripcion: 'Contundente victoria del Sub18. Martí Casas lanzó 6 innings perfectos.',
    },
    {
      categoriaId: categoriaSenior.id,
      rival: 'CB Badalona',
      fecha: new Date('2024-10-26T11:00:00'),
      esLocal: true,
      campo: 'Campo Municipal Granollers',
      resultado: '9-2',
      descripcion: 'El senior golea a Badalona y se pone líder de la clasificación.',
    },
    {
      categoriaId: categoriaSub16.id,
      rival: 'CB Mataró',
      fecha: new Date('2024-11-02T10:00:00'),
      esLocal: false,
      campo: 'Camp Municipal de Mataró',
      resultado: '6-6',
      descripcion: 'Empate en un partido muy disputado con remontada incluida.',
    },
    // Próximos partidos
    {
      categoriaId: categoriaSenior.id,
      rival: 'CB Mollet',
      fecha: new Date('2025-04-05T11:00:00'),
      esLocal: true,
      campo: 'Campo Municipal Granollers',
      resultado: null,
      descripcion: null,
    },
    {
      categoriaId: categoriaSub18.id,
      rival: 'CB Terrassa',
      fecha: new Date('2025-04-06T10:00:00'),
      esLocal: false,
      campo: 'Camp Municipal de Terrassa',
      resultado: null,
      descripcion: null,
    },
    {
      categoriaId: categoriaSenior.id,
      rival: 'CB Reus',
      fecha: new Date('2025-04-12T11:00:00'),
      esLocal: false,
      campo: 'Camp Municipal de Reus',
      resultado: null,
      descripcion: null,
    },
    {
      categoriaId: categoriaSub16.id,
      rival: 'CB Hospitalet',
      fecha: new Date('2025-04-13T10:00:00'),
      esLocal: true,
      campo: 'Campo Municipal Granollers',
      resultado: null,
      descripcion: null,
    },
    {
      categoriaId: categoriaSenior.id,
      rival: 'CB Vilafranca',
      fecha: new Date('2025-04-19T11:00:00'),
      esLocal: true,
      campo: 'Campo Municipal Granollers',
      resultado: null,
      descripcion: 'Partido de revancha, crucial para el liderato.',
    },
  ];

  // Creamos los partidos sin upsert porque no tienen campo único natural
  const partidosExistentes = await prisma.partido.count();
  if (partidosExistentes === 0) {
    await prisma.partido.createMany({ data: partidosData });
    console.log(`   ✅ ${partidosData.length} partidos creados\n`);
  } else {
    console.log(`   ⏭️  Partidos ya existentes, omitiendo\n`);
  }

  // ─── Resumen final ──────────────────────────────────────────────────────────
  console.log('────────────────────────────────────────────────────');
  console.log('✅ Seed completado con éxito!\n');
  console.log('📋 Credenciales de acceso:');
  console.log('   Admin  → admin@cbgranollers.cat  / Admin1234!');
  console.log('   Socio  → socio@ejemplo.com       / User1234!');
  console.log('   Jugador→ jugador@ejemplo.com     / User1234!');
  console.log('────────────────────────────────────────────────────\n');
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
