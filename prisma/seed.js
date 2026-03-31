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
    // ── ROPA ──────────────────────────────────────────────────────────────────
    {
      nombre: 'Camiseta de Juego Oficial CB Granollers',
      descripcion: 'Camiseta de juego oficial del Club Béisbol Granollers temporada 2024-2025. Confeccionada en tejido técnico 100% poliéster, ultraligero y transpirable, con tecnología de gestión de la humedad. Corte atlético, costuras reforzadas en hombros y axilas para máxima libertad de movimiento. Escudo bordado en el pecho, personalizable con nombre y número. Disponible en tallas XS a 3XL.',
      precio: 44.99,
      stock: 50,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1588534510807-b9e5a3e8e2a5?w=600&q=80',
    },
    {
      nombre: 'Camiseta de Entrenamiento CB Granollers',
      descripcion: 'Camiseta técnica para entrenamientos diarios. Tejido mesh de doble capa que favorece la ventilación durante los esfuerzos intensos. Cuello redondo, mangas cortas con acabado antideslizante en el interior del brazo lanzador. Logotipo del club en serigrafía reflectante. Disponible en tallas XS a 3XL. Lavable a máquina a 30°C.',
      precio: 29.99,
      stock: 60,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    },
    {
      nombre: 'Pantalón de Juego Oficial CB Granollers',
      descripcion: 'Pantalón de béisbol de competición en tejido doble tejido stretch para total libertad de movimiento. Cinturilla elástica con pasadores para cinturón, rodillas reforzadas con padding interior desmontable. Bolsillos laterales y trasero con velcro. Disponible en blanco con franja azul marino. Tallas XS a 3XL.',
      precio: 39.99,
      stock: 45,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    },
    {
      nombre: 'Pantalón de Entrenamiento CB Granollers',
      descripcion: 'Pantalón largo para entrenamientos, confeccionado en tejido técnico stretch ligero. Cinturilla elástica ancha con cordón interno ajustable. Rodillas con triple costura de refuerzo. Dos bolsillos laterales con cremallera. Color azul marino con detalles en azul eléctrico. Tallas XS a 3XL.',
      precio: 32.99,
      stock: 40,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
    },
    {
      nombre: 'Medias de Béisbol CB Granollers (par)',
      descripcion: 'Medias altas de béisbol en algodón/poliéster con franjas del club. Caña alta hasta la rodilla, elástico superior antideslizante, talón y puntera reforzados. Disponibles en talla única (adulto) y en talla infantil. Color azul marino con franja blanca y roja.',
      precio: 9.99,
      stock: 120,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&q=80',
    },
    {
      nombre: 'Cinturón de Béisbol CB Granollers',
      descripcion: 'Cinturón oficial de béisbol en nylon resistente con hebilla de plástico de liberación rápida. Ancho 3,8 cm, compatible con todos los pantalones de béisbol. Color azul marino con hebilla negra. Talla única ajustable de 70 a 120 cm.',
      precio: 12.99,
      stock: 80,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    },
    {
      nombre: 'Gorra Oficial CB Granollers',
      descripcion: 'Gorra estructurada de 6 paneles con visera curva y el escudo bordado del club en relieve. Cierre trasero snapback ajustable. Fabricada en lana acrílica 85% / poliéster 15%. Sudadero interior en felpa absorbente. Disponible en azul marino con visera negra.',
      precio: 24.99,
      stock: 80,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
    },
    {
      nombre: 'Sudadera Hoodie CB Granollers',
      descripcion: 'Sudadera con capucha y bolsillo canguro. Escudo bordado en el pecho izquierdo y lettering "Granollers Baseball" en la espalda. 80% algodón peinado, 20% poliéster. Interior afelpado suave. Puños y bajo con elástico acanalado. Disponible en tallas XS a 3XL.',
      precio: 49.99,
      stock: 30,
      categoria: 'ROPA',
      imagen: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
    },
    // ── BATES ─────────────────────────────────────────────────────────────────
    {
      nombre: 'Bate de Madera Profesional Maple 33"',
      descripcion: 'Bate de madera de arce (maple) de grado profesional para jugadores senior. Longitud 33", peso 30 oz. Perfil C271, el preferido de los bateadores de contacto. Mango fino lacado antideslizante, barril grueso para mayor área de contacto. Acabado natural con logotipo del club en serigrafia. Apto para competición federada.',
      precio: 89.99,
      stock: 12,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&q=80',
    },
    {
      nombre: 'Bate de Madera Ash 32" Junior',
      descripcion: 'Bate de fresno (ash) ideal para jugadores júnior (Sub16, Sub18). Longitud 32", peso 28 oz. Madera de fresno con mayor flexibilidad que el maple, lo que ofrece más sensación de bateo. Perfil R161 de mango medio. Acabado barnizado brillante. Certificado para uso en competición juvenil.',
      precio: 69.99,
      stock: 15,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=600&q=80',
    },
    {
      nombre: 'Bate de Madera Bambú Entrenamiento 34"',
      descripcion: 'Bate de bambú laminado de alta resistencia, perfecto para sesiones de entrenamiento intensivo en el tee o con lanzador. Longitud 34", peso 32 oz. El bambú es hasta 3 veces más duro que el maple tradicional, ideal para mejorar la mecánica sin desgastar los bates de competición. Acabado mate antideslizante.',
      precio: 54.99,
      stock: 18,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1562552052-56a6f17dbd63?w=600&q=80',
    },
    // ── GUANTES ───────────────────────────────────────────────────────────────
    {
      nombre: 'Guante Receptor Cuero Premium 12.5"',
      descripcion: 'Guante de primera base/campo exterior en cuero genuino de primera calidad. Talla 12.5", guantera profunda para mayor área de recepción. Interior acolchado en espuma de alta densidad con ventilación posterior. Bolsillo preformado para uso inmediato. Para mano derecha (jugador zurdo). Ideal para seniors y juveniles.',
      precio: 119.99,
      stock: 8,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=80',
    },
    {
      nombre: 'Guante Infield Cuero 11.25"',
      descripcion: 'Guante de campo interior (segunda base, shortstop, tercera base) en cuero de steerhide tratado. Talla 11.25", bolsillo poco profundo para transferencia rápida al lanzamiento. Abertura de dedos con espacio para mejorar el agarre y control. Diseño profesional con palma perforada para reducir el peso. Para mano izquierda (jugador diestro).',
      precio: 109.99,
      stock: 10,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=600&q=80',
    },
    {
      nombre: 'Guante Outfield Cuero 12.75"',
      descripcion: 'Guante de jardín exterior en cuero premium con bolsillo profundo para capturar fly balls. Talla 12.75", uno de los más grandes del mercado. Dedos largos y bolsillo en H para mayor área de captura. Refuerzo en el pulgar con cuero adicional. Correa de muñeca ajustable. Para mano izquierda (jugador diestro).',
      precio: 129.99,
      stock: 7,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80',
    },
    {
      nombre: 'Guante Juvenil Cuero Sintético 11" Sub14/Sub16',
      descripcion: 'Guante en cuero sintético de alta calidad para jugadores de categorías Sub14 y Sub16. Talla 11", preformado de fábrica para uso inmediato sin necesidad de rompimiento. Diseño universal apto para cualquier posición. Forro interior suave, correa de muñeca con velcro ajustable. Para mano izquierda (jugador diestro). Colores: negro/azul.',
      precio: 64.99,
      stock: 20,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80',
    },
    {
      nombre: 'Guante Infantil 10.5" Sub10/Sub12',
      descripcion: 'Guante en piel sintética suave y flexible, diseñado específicamente para las categorías más jóvenes (Sub10 y Sub12). Talla 10.5", muy ligero para facilitar el cierre a manos pequeñas. Interior acolchado extra para mayor comodidad. Cierre de velcro en la muñeca de fácil ajuste. Para mano izquierda (jugador diestro). Incluye instrucciones de mantenimiento.',
      precio: 39.99,
      stock: 25,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80',
    },
    // ── MOCHILAS ──────────────────────────────────────────────────────────────
    {
      nombre: 'Mochila de Béisbol CB Granollers Pro',
      descripcion: 'Mochila específica para béisbol con capacidad de 35 litros. Compartimento principal para casco y ropa, bolsillo lateral tubular para 2 bates, compartimento frontal para accesorios pequeños, bolsillo lateral de malla para botella de agua. Asas ergonómicas acolchadas con soporte lumbar. Logotipo CB Granollers bordado. Color azul marino / negro.',
      precio: 69.99,
      stock: 20,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    },
    {
      nombre: 'Mochila de Entrenamiento CB Granollers Lite',
      descripcion: 'Mochila ligera de 20 litros para entrenamientos y desplazamientos. Un compartimento principal amplio, bolsillo frontal con organizer para objetos personales, bolsillo lateral en malla para botella. Asas acolchadas. Fabricada en nylon 600D resistente al agua. Con cinta reflectante para seguridad nocturna. Logotipo del club en serigrafia.',
      precio: 44.99,
      stock: 25,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&q=80',
    },
    // ── PELOTAS ───────────────────────────────────────────────────────────────
    {
      nombre: 'Pelota Oficial de Béisbol (pack 3)',
      descripcion: 'Pack de 3 pelotas de béisbol de competición con núcleo de corcho y goma, bobinado de hilo de lana y cuero de primera calidad con costuras de hilo encerado rojo. Peso 142g ± 3g, circunferencia 23 cm ± 0.5 cm. Homologadas por la Real Federación Española de Béisbol y Sóftbol (RFEBS) para competición federada.',
      precio: 19.99,
      stock: 100,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=600&q=80',
    },
    {
      nombre: 'Pelota de Entrenamiento Reducida (pack 6)',
      descripcion: 'Pack de 6 pelotas de entrenamiento de reducida dureza, ideales para iniciación y trabajo de lanzamiento en espacios reducidos. Núcleo de espuma comprimida con cubierta de cuero sintético. Mismas dimensiones y peso que la pelota oficial. Perfectas para Sub10 y Sub12. No homologadas para competición.',
      precio: 22.99,
      stock: 80,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=600&q=80',
    },
    {
      nombre: 'Pelota de Tee Weighted Training (pack 4)',
      descripcion: 'Pack de 4 pelotas de entrenamiento de bateo en tee, con peso aumentado (200g) para desarrollar la musculatura específica del batazo. Cubierta de cuero duradero, costuras reforzadas para soportar el impacto repetido con el bate. Úsalas con los bates de entrenamiento. No apta para lanzamiento ni para competición.',
      precio: 28.99,
      stock: 50,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1527949986956-f28c7d91acfc?w=600&q=80',
    },
    // ── GUANTILLAS DE BATEO ───────────────────────────────────────────────────
    {
      nombre: 'Guantillas de Bateo Senior CB Granollers',
      descripcion: 'Guantillas de bateo profesionales con palma en cuero cabretta de primera calidad para máxima sensación de contacto. Dorso en lycra elástica con ventilación en celdas hexagonales. Cierre en muñeca con velcro ancho ajustable. Acolchado en nudillos con espuma de doble densidad. Disponibles en talla S, M, L, XL. Color azul marino/blanco.',
      precio: 34.99,
      stock: 40,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80',
    },
    {
      nombre: 'Guantillas de Bateo Junior (Sub14/Sub16)',
      descripcion: 'Guantillas de bateo para jugadores júnior. Palma en cuero sintético de tacto similar al cuero genuino. Dorso transpirable en malla elástica. Cierre con velcro en la muñeca. Acolchado ligero en nudillos. Disponibles en talla XS, S, M. Color negro/azul con logo CB Granollers. Lavables a máquina a 30°C.',
      precio: 24.99,
      stock: 35,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1617711773026-ea5e6a7a4c8f?w=600&q=80',
    },
    {
      nombre: 'Guantillas de Bateo Infantil (Sub10/Sub12)',
      descripcion: 'Guantillas diseñadas para las manos más pequeñas. Material exterior en cuero sintético suave muy flexible. Sistema de cierre con velcro de fácil colocación y retirada autónoma. Acolchado extra en toda la palma para mayor protección. Tallas XXS y XS. Colores: azul/blanco. Ideales para la iniciación al béisbol.',
      precio: 17.99,
      stock: 30,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    },
    // ── EQUIPAMIENTO ADICIONAL ─────────────────────────────────────────────────
    {
      nombre: 'Casco de Bateo Doble Oído Senior',
      descripcion: 'Casco de bateo certificado para competición senior. Protección doble oído (ambos lados), carcasa de ABS de alta resistencia a impactos, interior acolchado en espuma de baja densidad con forro de lycra absorbente. Ventilación superior con 4 rejillas. Tallas 7, 7¼, 7½, 7¾. Certificación NOCSAE.',
      precio: 49.99,
      stock: 20,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80',
    },
    {
      nombre: 'Tee de Bateo Ajustable Profesional',
      descripcion: 'Tee de bateo con base antideslizante de caucho y vástago telescópico regulable en altura de 60 a 100 cm. Base lastrada de 3 kg para máxima estabilidad. Punta de goma flexible que no daña el bate. Perfecto para trabajar la mecánica del swing en solitario. Uso interior y exterior. Desmontable para facilitar el transporte.',
      precio: 59.99,
      stock: 10,
      categoria: 'EQUIPAMIENTO',
      imagen: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80',
    },
    // ── MERCHANDISING ─────────────────────────────────────────────────────────
    {
      nombre: 'Taza CB Granollers 330ml',
      descripcion: 'Taza de cerámica de 330ml con el escudo oficial del club en serigrafía de alta resolución resistente al lavado. Interior blanco, exterior azul marino. Apta para microondas y lavavajillas. El regalo perfecto para cualquier fan del béisbol. Presentada en caja de cartón con el logo del club.',
      precio: 12.99,
      stock: 60,
      categoria: 'MERCHANDISING',
      imagen: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
    },
    {
      nombre: 'Llavero CB Granollers',
      descripcion: 'Llavero metálico con el escudo del club en esmalte duro bicolor. Acabado en acero inoxidable 304 resistente a la corrosión. Anilla portallaves de 25mm de diámetro. Dimensiones del colgante: 4 x 3 cm. Presentado en sobre de cartón con el nombre del club.',
      precio: 7.99,
      stock: 150,
      categoria: 'MERCHANDISING',
      imagen: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
    },
    {
      nombre: 'Bufanda Jacquard CB Granollers',
      descripcion: 'Bufanda oficial de aficionado en tejido jacquard de alta calidad. Diseño bicolor azul marino y blanco con el nombre y escudo del club integrados en el tejido. Dimensiones 22 x 140 cm. 100% acrílico suave al tacto. Perfecta para animar en los partidos en días frescos.',
      precio: 19.99,
      stock: 45,
      categoria: 'MERCHANDISING',
      imagen: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80',
    },
    {
      nombre: 'Pin Esmaltado CB Granollers',
      descripcion: 'Pin metálico con el escudo del club en esmalte duro de 4 colores, acabado dorado. Dimensiones 2.5 x 2.5 cm. Cierre mariposa en la parte trasera. Ideal para coleccionistas y para personalizar mochilas, chaquetas o gorras. Presentado en tarjeta de cartón con el logo del club.',
      precio: 5.99,
      stock: 200,
      categoria: 'MERCHANDISING',
      imagen: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
    },
    {
      nombre: 'Pegatina Pack CB Granollers (5 uds)',
      descripcion: 'Pack de 5 pegatinas con diseños exclusivos del CB Granollers: escudo clásico, texto retro, béisbol vintage, versión animada y edición conmemorativa 25 aniversario. Impresión en vinilo resistente al agua y a los rayos UV, apta para uso en exterior. Tamaños variados entre 5 y 10 cm. Fácil aplicación y retirada sin residuos.',
      precio: 6.99,
      stock: 180,
      categoria: 'MERCHANDISING',
      imagen: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
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
