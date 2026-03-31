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
        temporada: '2025-2026',
        estado: 'APROBADA',
        notas: 'Inscripción de prueba generada por seed',
      },
    });
  }
  console.log(`   ✅ Inscripción creada para jugador en SUB14\n`);

  // ─── 4b. Técnicos y jugadores por categoría ─────────────────────────────────
  console.log('👥 Creando técnicos y jugadores por categoría...');

  // Datos de técnicos — nombres coinciden con entrenadores de las categorías
  const tecnicosData = [
    { nombre: 'Carlos',  apellidos: 'Martínez López',  email: 'cmartinez@cbgranollers.cat',  categoria: 'SUB10'  },
    { nombre: 'Laura',   apellidos: 'Pérez Domínguez', email: 'lperez@cbgranollers.cat',     categoria: 'SUB12'  },
    { nombre: 'Marc',    apellidos: 'Torres Vidal',     email: 'mtorres@cbgranollers.cat',    categoria: 'SUB14'  },
    { nombre: 'David',   apellidos: 'Sánchez Ruiz',     email: 'dsanchez@cbgranollers.cat',   categoria: 'SUB16'  },
    { nombre: 'Àlex',    apellidos: 'Ribera Puigdomènech', email: 'aribera@cbgranollers.cat', categoria: 'SUB18'  },
    { nombre: 'Roberto', apellidos: 'Fuentes Carmona', email: 'rfuentes@cbgranollers.cat',   categoria: 'SENIOR' },
  ];

  for (const t of tecnicosData) {
    const cat = categorias.find(c => c.nombre === t.categoria);
    const persona = await prisma.persona.upsert({
      where: { email: t.email },
      update: {},
      create: {
        nombre: t.nombre,
        apellidos: t.apellidos,
        email: t.email,
        password: hashUser,
        telefono: '93800000' + (tecnicosData.indexOf(t) + 2),
        fechaNacimiento: new Date('1980-01-01'),
        rol: { create: { tipo: 'TECNICO' } },
      },
    });
    const inscrExiste = await prisma.inscripcion.findFirst({
      where: { personaId: persona.id, categoriaId: cat.id },
    });
    if (!inscrExiste) {
      await prisma.inscripcion.create({
        data: { personaId: persona.id, categoriaId: cat.id, temporada: '2025-2026', estado: 'APROBADA' },
      });
    }
  }
  console.log(`   ✅ ${tecnicosData.length} técnicos creados\n`);

  // Datos de jugadores — 6 por categoría
  const jugadoresData = [
    // SUB10
    { nombre: 'Pau',      apellidos: 'Garcia Soler',       email: 'pau.garcia@ejemplo.com',      categoria: 'SUB10',  nacimiento: '2015-03-12' },
    { nombre: 'Arnau',    apellidos: 'López Mas',           email: 'arnau.lopez@ejemplo.com',     categoria: 'SUB10',  nacimiento: '2015-06-25' },
    { nombre: 'Jan',      apellidos: 'Ferrer Puig',         email: 'jan.ferrer@ejemplo.com',      categoria: 'SUB10',  nacimiento: '2015-09-08' },
    { nombre: 'Biel',     apellidos: 'Roca Vila',           email: 'biel.roca@ejemplo.com',       categoria: 'SUB10',  nacimiento: '2016-01-20' },
    { nombre: 'Laia',     apellidos: 'Martí Bosch',         email: 'laia.marti@ejemplo.com',      categoria: 'SUB10',  nacimiento: '2015-11-30' },
    { nombre: 'Marta',    apellidos: 'Pujol Sala',          email: 'marta.pujol@ejemplo.com',     categoria: 'SUB10',  nacimiento: '2016-04-15' },
    // SUB12
    { nombre: 'Nil',      apellidos: 'Soler Camps',         email: 'nil.soler@ejemplo.com',       categoria: 'SUB12',  nacimiento: '2013-02-17' },
    { nombre: 'Iker',     apellidos: 'Vidal Costa',         email: 'iker.vidal@ejemplo.com',      categoria: 'SUB12',  nacimiento: '2013-05-03' },
    { nombre: 'Júlia',    apellidos: 'Mas Torrent',          email: 'julia.mas@ejemplo.com',       categoria: 'SUB12',  nacimiento: '2013-08-22' },
    { nombre: 'Alex',     apellidos: 'Castells Mir',        email: 'alex.castells@ejemplo.com',   categoria: 'SUB12',  nacimiento: '2014-01-09' },
    { nombre: 'Roger',    apellidos: 'Planes Font',          email: 'roger.planes@ejemplo.com',    categoria: 'SUB12',  nacimiento: '2013-10-14' },
    { nombre: 'Emma',     apellidos: 'Molina Serra',        email: 'emma.molina@ejemplo.com',     categoria: 'SUB12',  nacimiento: '2014-03-28' },
    // SUB14
    { nombre: 'Oriol',    apellidos: 'Giménez Roca',        email: 'oriol.gimenez@ejemplo.com',   categoria: 'SUB14',  nacimiento: '2011-07-04' },
    { nombre: 'Pol',      apellidos: 'Ferreira Nadal',      email: 'pol.ferreira@ejemplo.com',    categoria: 'SUB14',  nacimiento: '2011-11-19' },
    { nombre: 'Carla',    apellidos: 'Oliveras Puig',       email: 'carla.oliveras@ejemplo.com',  categoria: 'SUB14',  nacimiento: '2012-02-08' },
    { nombre: 'Sergi',    apellidos: 'Badia Llull',         email: 'sergi.badia@ejemplo.com',     categoria: 'SUB14',  nacimiento: '2011-09-27' },
    { nombre: 'Gael',     apellidos: 'Navarro Comas',       email: 'gael.navarro@ejemplo.com',    categoria: 'SUB14',  nacimiento: '2012-05-16' },
    { nombre: 'Mireia',   apellidos: 'Casamitjana Font',    email: 'mireia.casa@ejemplo.com',     categoria: 'SUB14',  nacimiento: '2011-12-01' },
    // SUB16
    { nombre: 'Martí',    apellidos: 'Casas Ribas',         email: 'marti.casas@ejemplo.com',     categoria: 'SUB16',  nacimiento: '2009-04-11' },
    { nombre: 'Hugo',     apellidos: 'Domínguez Vara',      email: 'hugo.dominguez@ejemplo.com',  categoria: 'SUB16',  nacimiento: '2009-08-29' },
    { nombre: 'Aina',     apellidos: 'Pons Esteve',         email: 'aina.pons@ejemplo.com',       categoria: 'SUB16',  nacimiento: '2010-01-14' },
    { nombre: 'Dani',     apellidos: 'Correa Blanco',       email: 'dani.correa@ejemplo.com',     categoria: 'SUB16',  nacimiento: '2009-06-23' },
    { nombre: 'Edu',      apellidos: 'Morales Carrasco',    email: 'edu.morales@ejemplo.com',     categoria: 'SUB16',  nacimiento: '2010-03-07' },
    { nombre: 'Noa',      apellidos: 'Ros Espinosa',        email: 'noa.ros@ejemplo.com',         categoria: 'SUB16',  nacimiento: '2009-10-18' },
    // SUB18
    { nombre: 'Bernat',   apellidos: 'Arenas Coll',         email: 'bernat.arenas@ejemplo.com',   categoria: 'SUB18',  nacimiento: '2007-03-05' },
    { nombre: 'Guillem',  apellidos: 'Solà Farrés',         email: 'guillem.sola@ejemplo.com',    categoria: 'SUB18',  nacimiento: '2007-07-21' },
    { nombre: 'Ivet',     apellidos: 'Camprubí Mir',        email: 'ivet.camprubi@ejemplo.com',   categoria: 'SUB18',  nacimiento: '2008-01-30' },
    { nombre: 'Lluc',     apellidos: 'Batlle Sunyer',       email: 'lluc.batlle@ejemplo.com',     categoria: 'SUB18',  nacimiento: '2007-11-12' },
    { nombre: 'Ricard',   apellidos: 'Figueras Pont',       email: 'ricard.figueras@ejemplo.com', categoria: 'SUB18',  nacimiento: '2008-04-09' },
    { nombre: 'Laia',     apellidos: 'Tarragó Valls',       email: 'laia.tarrago@ejemplo.com',    categoria: 'SUB18',  nacimiento: '2007-09-17' },
    // SENIOR
    { nombre: 'Marc',     apellidos: 'Puig Batalla',        email: 'marc.puig@ejemplo.com',       categoria: 'SENIOR', nacimiento: '2000-05-14' },
    { nombre: 'Daniel',   apellidos: 'Moreno Ibáñez',      email: 'daniel.moreno@ejemplo.com',   categoria: 'SENIOR', nacimiento: '1999-08-31' },
    { nombre: 'Adrià',    apellidos: 'Casanova Pla',        email: 'adria.casanova@ejemplo.com',  categoria: 'SENIOR', nacimiento: '2001-02-22' },
    { nombre: 'Santi',    apellidos: 'Flores Guerrero',     email: 'santi.flores@ejemplo.com',    categoria: 'SENIOR', nacimiento: '1998-11-06' },
    { nombre: 'Xavi',     apellidos: 'Boada Moll',          email: 'xavi.boada@ejemplo.com',      categoria: 'SENIOR', nacimiento: '2002-07-18' },
    { nombre: 'Alba',     apellidos: 'Gispert Cros',        email: 'alba.gispert@ejemplo.com',    categoria: 'SENIOR', nacimiento: '2000-03-25' },
    { nombre: 'Toni',     apellidos: 'Espada Rius',         email: 'toni.espada@ejemplo.com',     categoria: 'SENIOR', nacimiento: '1997-09-03' },
    { nombre: 'Roc',      apellidos: 'Julià Pagès',         email: 'roc.julia@ejemplo.com',       categoria: 'SENIOR', nacimiento: '2001-12-11' },
  ];

  for (const j of jugadoresData) {
    const cat = categorias.find(c => c.nombre === j.categoria);
    const persona = await prisma.persona.upsert({
      where: { email: j.email },
      update: {},
      create: {
        nombre: j.nombre,
        apellidos: j.apellidos,
        email: j.email,
        password: hashUser,
        fechaNacimiento: new Date(j.nacimiento),
        rol: { create: { tipo: 'JUGADOR' } },
      },
    });
    const inscrExiste = await prisma.inscripcion.findFirst({
      where: { personaId: persona.id, categoriaId: cat.id },
    });
    if (!inscrExiste) {
      await prisma.inscripcion.create({
        data: { personaId: persona.id, categoriaId: cat.id, temporada: '2025-2026', estado: 'APROBADA' },
      });
    }
  }
  console.log(`   ✅ ${jugadoresData.length} jugadores creados\n`);

  // ─── 5. Noticias ────────────────────────────────────────────────────────────
  console.log('📰 Creando noticias...');
  const noticiaData = [
    {
      titulo: 'El CB Granollers arranca la temporada 2025-2026 con grandes expectativas',
      resumen: 'El club granollerí presenta su plantilla más amplia de la historia con 8 equipos en competición.',
      contenido: `El Club Béisbol Granollers ha comenzado oficialmente la temporada 2025-2026 con una presentación de equipos que llenó las instalaciones del campo municipal. Con más de 150 jugadores federados, el club afronta el curso más ambicioso de su historia.\n\nEl equipo senior, dirigido por Roberto Fuentes, aspira al ascenso a la División de Honor nacional, mientras que las categorías base presentan un estado de forma excelente tras una intensa pretemporada.\n\n"Estamos muy ilusionados con lo que hemos preparado este verano. El nivel de compromiso de los jugadores y de las familias es increíble", declaró el presidente del club durante el acto de presentación.\n\nLa temporada comienza el próximo sábado con el primer partido oficial del equipo senior en casa.`,
      publicadoEn: new Date('2025-09-10'),
      autor: 'Redacción CB Granollers',
      destacada: true,
    },
    {
      titulo: 'El equipo Sub18 se proclama campeón del Torneo de Primavera 2025',
      resumen: 'Los jóvenes jugadores granolleríes ganaron el torneo invictos con 5 victorias en 5 partidos.',
      contenido: `El equipo Sub18 del CB Granollers se coronó campeón del XXII Torneo de Primavera disputado en Hospitalet de Llobregat. Los jugadores dirigidos por Àlex Ribera completaron una actuación perfecta ganando los cinco partidos de la competición.\n\nLa final se disputó el domingo por la tarde ante el CB Vilafranca, a quienes vencieron por 8-2 en un partido dominado de principio a fin. El MVP del torneo fue el lanzador Martí Casas, quien completó dos aperturas sin carreras limpias en contra.\n\n"Estos chicos han trabajado muchísimo y se lo merecen. El equipo ha crecido un 100% respecto al año pasado", comentó orgulloso el entrenador Àlex Ribera.\n\nEl trofeo ya está expuesto en la sede del club junto a los demás reconocimientos de la temporada.`,
      publicadoEn: new Date('2025-05-20'),
      autor: 'Redacción CB Granollers',
      destacada: true,
    },
    {
      titulo: 'Nuevas instalaciones en el campo municipal completadas',
      resumen: 'El Ayuntamiento de Granollers completa la reforma del campo de béisbol con nuevos vestuarios y tribuna ampliada.',
      contenido: `El Ayuntamiento de Granollers ha finalizado las obras de mejora de las instalaciones del campo municipal de béisbol. Los nuevos vestuarios, la ampliación de la tribuna principal y el nuevo sistema de iluminación LED ya están listos para la temporada 2025-2026.\n\n"Es un reconocimiento al trabajo que lleva haciendo el club durante más de 20 años. Granollers se merece unas instalaciones acordes al nivel del béisbol que se practica aquí", declaró la regidora de deportes durante la inauguración oficial.\n\nEl campo renovado fue estrenado en el primer partido de liga de la temporada ante el CB Hospitalet, con más de 300 espectadores en las gradas.`,
      publicadoEn: new Date('2025-09-22'),
      autor: 'Redacción CB Granollers',
      destacada: false,
    },
    {
      titulo: 'Jornada de puertas abiertas: más de 80 niños descubren el béisbol',
      resumen: 'El club organizó una exitosa jornada de iniciación con récord de participación infantil.',
      contenido: `El CB Granollers organizó el pasado sábado una jornada de puertas abiertas que superó todas las expectativas con la participación de más de 80 niños y niñas de entre 6 y 12 años. Los entrenadores del club prepararon juegos y actividades adaptadas a cada edad.\n\nLos pequeños pudieron batear, lanzar y atrapar en un ambiente divertido y seguro. La jornada culminó con un partido amistoso entre los participantes que arrancó los aplausos de los padres presentes.\n\n"Es la cantera del futuro. Ver la ilusión de estos chavales nos llena de energía para seguir trabajando", declaró el coordinador de cantera del club.\n\nEl club ha abierto el plazo de inscripción para la categoría Sub10 de la temporada 2025-2026.`,
      publicadoEn: new Date('2025-10-18'),
      autor: 'Redacción CB Granollers',
      destacada: false,
    },
    {
      titulo: 'El senior lidera la clasificación tras una brillante primera vuelta',
      resumen: 'Con 8 victorias y 1 derrota, el equipo senior de Granollers encabeza el grupo A de la División de Honor catalana.',
      contenido: `Tras completar la primera vuelta de la temporada 2025-2026, el equipo senior del CB Granollers lidera la clasificación del Grupo A de la División de Honor de béisbol catalán con 8 victorias y tan solo 1 derrota.\n\nEl balance es histórico para el club granollerí. El trabajo de Roberto Fuentes está dando sus frutos y la afición empieza a soñar en serio con el título.\n\nDestacados de la primera vuelta: el lanzador Daniel Moreno acumula 52 strikeouts en 7 aperturas con un ERA de 1.84, mientras que el campo interior ha cometido solo 2 errores en 9 partidos. El bateador Marc Puig lidera el equipo con un promedio de .342.\n\nLos próximos compromisos de la segunda vuelta serán cruciales para mantener el liderato y conseguir la clasificación para el campeonato nacional.`,
      publicadoEn: new Date('2025-12-08'),
      autor: 'Redacción CB Granollers',
      destacada: true,
    },
  ];

  for (const noticia of noticiaData) {
    await prisma.noticia.upsert({
      where: { titulo: noticia.titulo },
      update: {
        publicadoEn: noticia.publicadoEn,
        resumen: noticia.resumen,
        contenido: noticia.contenido,
        destacada: noticia.destacada,
      },
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
  const categoriaSub10 = categorias.find(c => c.nombre === 'SUB10');
  const categoriaSub12 = categorias.find(c => c.nombre === 'SUB12');

  const rivalList = ['CB Hospitalet', 'CB Vilafranca', 'CB Sabadell', 'CB Badalona', 'CB Mataró', 'CB Mollet', 'CB Reus', 'CB Terrassa', 'CB Barcelona', 'CB Granollers B'];
  const campos = {
    'CB Hospitalet': 'Camp Municipal de Hospitalet',
    'CB Vilafranca': 'Camp Municipal de Vilafranca',
    'CB Sabadell': 'Camp Municipal de Sabadell',
    'CB Badalona': 'Camp Municipal de Badalona',
    'CB Mataró': 'Camp Municipal de Mataró',
    'CB Mollet': 'Camp Municipal de Mollet',
    'CB Reus': 'Camp Municipal de Reus',
    'CB Terrassa': 'Camp Municipal de Terrassa',
    'CB Barcelona': 'Camp Municipal de Barcelona',
    'CB Granollers B': 'Campo Municipal Granollers',
  };

  const partidosData = [

    // ══════════════════════════════════════════════════════════════════
    // RESULTADOS — TEMPORADA 2025-2026 (sep 2025 – mar 2026)
    // ══════════════════════════════════════════════════════════════════

    // ── SENIOR ──────────────────────────────────────────────────────
    { categoriaId: categoriaSenior.id, rival: 'CB Hospitalet',  fecha: new Date('2025-09-13T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',    resultado: '7-3',  descripcion: 'Gran victoria en el estreno de las nuevas instalaciones. Llenazo en tribuna.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Vilafranca',  fecha: new Date('2025-09-27T11:00:00'), esLocal: false, campo: 'Camp Municipal de Vilafranca',   resultado: '5-8',  descripcion: 'Primera derrota en una salida muy disputada.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Badalona',    fecha: new Date('2025-10-11T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',    resultado: '9-2',  descripcion: 'Golea a Badalona y se consolida líder.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Mollet',      fecha: new Date('2025-10-25T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',    resultado: '11-0', descripcion: 'Blanqueada perfecta. Daniel Moreno lanzó partido completo.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Reus',        fecha: new Date('2025-11-08T11:00:00'), esLocal: false, campo: 'Camp Municipal de Reus',        resultado: '6-4',  descripcion: 'Victoria clave fuera de casa.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Sabadell',    fecha: new Date('2025-11-22T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',    resultado: '8-1',  descripcion: 'Tercera blanqueada de la temporada. Liderato reforzado.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Terrassa',    fecha: new Date('2025-12-06T11:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',    resultado: '4-4',  descripcion: 'Empate en el último inning tras remontar un 4-1 en contra.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Barcelona',   fecha: new Date('2025-12-20T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',    resultado: '3-5',  descripcion: 'Primera derrota en casa ante un rival de gran nivel.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Hospitalet',  fecha: new Date('2026-01-17T11:00:00'), esLocal: false, campo: 'Camp Municipal de Hospitalet',  resultado: '6-2',  descripcion: 'Arranque sólido de la segunda vuelta fuera de casa.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Vilafranca',  fecha: new Date('2026-01-31T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',    resultado: '7-5',  descripcion: 'Revancha conseguida ante Vilafranca en un gran partido.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Badalona',    fecha: new Date('2026-02-14T11:00:00'), esLocal: false, campo: 'Camp Municipal de Badalona',    resultado: '10-3', descripcion: 'Paliza en Badalona. Marc Puig batea 2 jonrones.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Mollet',      fecha: new Date('2026-02-28T11:00:00'), esLocal: false, campo: 'Camp Municipal de Mollet',      resultado: '5-5',  descripcion: 'Empate en Mollet con remontada en el noveno inning.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Reus',        fecha: new Date('2026-03-14T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',    resultado: '8-2',  descripcion: 'Sólida victoria ante Reus que refuerza el liderato en la recta final.' },

    // ── SUB18 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub18.id, rival: 'CB Sabadell',   fecha: new Date('2025-09-20T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '12-4', descripcion: 'Martí Casas lanzó 6 innings perfectos en la primera jornada.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Terrassa',   fecha: new Date('2025-10-04T10:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',   resultado: '4-7',  descripcion: 'Derrota ante un rival muy sólido.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Hospitalet', fecha: new Date('2025-10-18T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '7-2',  descripcion: 'Dominio total ante Hospitalet.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Mataró',     fecha: new Date('2025-11-01T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: '3-3',  descripcion: 'Empate en un partido muy igualado.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Mollet',     fecha: new Date('2025-11-15T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '9-1',  descripcion: 'Clara victoria que lleva al Sub18 a la segunda posición.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Vilafranca', fecha: new Date('2025-11-29T10:00:00'), esLocal: false, campo: 'Camp Municipal de Vilafranca', resultado: '6-8',  descripcion: 'Derrota ajustada en el partido más difícil del año.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Badalona',   fecha: new Date('2025-12-13T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '8-0',  descripcion: 'Blanqueada del Sub18 para cerrar el año con buenas sensaciones.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Sabadell',   fecha: new Date('2026-01-24T10:00:00'), esLocal: false, campo: 'Camp Municipal de Sabadell',   resultado: '5-6',  descripcion: 'Derrota por un run en el último inning. Gran partido.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Terrassa',   fecha: new Date('2026-02-07T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '11-3', descripcion: 'Revancha conseguida con contundencia ante Terrassa.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Hospitalet', fecha: new Date('2026-02-21T10:00:00'), esLocal: false, campo: 'Camp Municipal de Hospitalet', resultado: '4-4',  descripcion: 'Empate trabajado fuera de casa.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Mataró',     fecha: new Date('2026-03-07T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '6-2',  descripcion: 'Victoria clave para asegurar el playoff.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Mollet',     fecha: new Date('2026-03-21T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mollet',     resultado: '7-4',  descripcion: 'Buena victoria fuera que confirma la clasificación.' },

    // ── SUB16 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub16.id, rival: 'CB Mataró',     fecha: new Date('2025-09-20T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: '6-6',  descripcion: 'Empate agónico con remontada en el noveno inning.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Sabadell',   fecha: new Date('2025-10-04T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '9-3',  descripcion: 'Gran partido con cuatro jonrones en el encuentro.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Hospitalet', fecha: new Date('2025-10-18T10:00:00'), esLocal: false, campo: 'Camp Municipal de Hospitalet', resultado: '2-7',  descripcion: 'Derrota clara fuera de casa ante un rival directo.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Vilafranca', fecha: new Date('2025-11-01T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '5-4',  descripcion: 'Victoria sufrida en el último at-bat de la entrada.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Badalona',   fecha: new Date('2025-11-15T10:00:00'), esLocal: false, campo: 'Camp Municipal de Badalona',   resultado: '8-2',  descripcion: 'Excelente actuación fuera de casa. Mejor partido de la temporada.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Terrassa',   fecha: new Date('2025-11-29T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '3-5',  descripcion: 'Derrota en casa que complica la clasificación.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Mollet',     fecha: new Date('2025-12-13T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '7-1',  descripcion: 'Victoria contundente para cerrar la primera vuelta con buen sabor.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Mataró',     fecha: new Date('2026-01-24T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '4-4',  descripcion: 'Empate con el rival directo. La clasificación sigue abierta.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Sabadell',   fecha: new Date('2026-02-07T10:00:00'), esLocal: false, campo: 'Camp Municipal de Sabadell',   resultado: '6-5',  descripcion: 'Victoria por un run en la segunda vuelta. Grupo muy igualado.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Hospitalet', fecha: new Date('2026-02-21T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '8-3',  descripcion: 'Revancha conseguida en casa ante Hospitalet.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Vilafranca', fecha: new Date('2026-03-07T10:00:00'), esLocal: false, campo: 'Camp Municipal de Vilafranca', resultado: '1-6',  descripcion: 'Derrota clara que complica las opciones del Sub16 de cara al playoff.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Badalona',   fecha: new Date('2026-03-21T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '9-4',  descripcion: 'Gran remontada en los últimos innings para llevarse el partido.' },

    // ── SUB14 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub14.id, rival: 'CB Granollers B', fecha: new Date('2025-09-27T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '8-5',  descripcion: 'Derby interno con victoria del equipo A. Partido muy emotivo.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Hospitalet',   fecha: new Date('2025-10-11T10:00:00'), esLocal: false, campo: 'Camp Municipal de Hospitalet', resultado: '4-6',  descripcion: 'Derrota ajustada fuera de casa en el debut en liga.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Mataró',       fecha: new Date('2025-10-25T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '7-3',  descripcion: 'Sólida victoria ante Mataró con buen pitcheo.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Sabadell',     fecha: new Date('2025-11-08T10:00:00'), esLocal: false, campo: 'Camp Municipal de Sabadell',   resultado: '5-5',  descripcion: 'Empate en un partido muy igualado donde nadie quiso perder.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Vilafranca',   fecha: new Date('2025-11-22T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '6-2',  descripcion: 'Victoria cómoda ante Vilafranca con buena defensa.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Terrassa',     fecha: new Date('2025-12-06T10:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',   resultado: '2-8',  descripcion: 'Derrota clara en Terrassa. El equipo aprende de la derrota.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Hospitalet',   fecha: new Date('2026-01-17T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '9-2',  descripcion: 'Revancha conseguida en casa ante Hospitalet. Muy buena actuación.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Mataró',       fecha: new Date('2026-01-31T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: '3-4',  descripcion: 'Derrota por un run en Mataró en un partido muy igualado.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Sabadell',     fecha: new Date('2026-02-14T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '7-1',  descripcion: 'Dominante victoria en casa con tres jonrones del equipo.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Vilafranca',   fecha: new Date('2026-02-28T10:00:00'), esLocal: false, campo: 'Camp Municipal de Vilafranca', resultado: '4-3',  descripcion: 'Emocionante victoria en el último inning fuera de casa.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Terrassa',     fecha: new Date('2026-03-14T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '8-4',  descripcion: 'Revancha ante Terrassa con gran actuación colectiva.' },

    // ── SUB12 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub12.id, rival: 'CB Hospitalet',   fecha: new Date('2025-10-04T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '5-3',  descripcion: 'Primera victoria de la temporada para los chicos del Sub12.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Sabadell',     fecha: new Date('2025-10-18T10:00:00'), esLocal: false, campo: 'Camp Municipal de Sabadell',   resultado: '2-6',  descripcion: 'Derrota fuera de casa con buenas sensaciones de juego.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Mataró',       fecha: new Date('2025-11-01T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '4-4',  descripcion: 'Empate muy disputado. Gran nivel para la categoría.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Vilafranca',   fecha: new Date('2025-11-15T10:00:00'), esLocal: false, campo: 'Camp Municipal de Vilafranca', resultado: '3-5',  descripcion: 'Derrota ajustada con mejora notable en la defensa.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Terrassa',     fecha: new Date('2025-11-29T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '6-2',  descripcion: 'Buena victoria en casa. Los niños disfrutan del béisbol.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Badalona',     fecha: new Date('2025-12-13T10:00:00'), esLocal: false, campo: 'Camp Municipal de Badalona',   resultado: '1-7',  descripcion: 'Derrota abultada lejos de casa. Mucho por mejorar.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Hospitalet',   fecha: new Date('2026-01-24T10:00:00'), esLocal: false, campo: 'Camp Municipal de Hospitalet', resultado: '4-2',  descripcion: 'Victoria fuera de casa que levanta el ánimo del equipo.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Sabadell',     fecha: new Date('2026-02-07T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '5-4',  descripcion: 'Remontada en el último inning para sumar tres puntos vitales.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Mataró',       fecha: new Date('2026-02-21T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: '3-3',  descripcion: 'Empate justo ante Mataró en partido muy igualado.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Vilafranca',   fecha: new Date('2026-03-07T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '7-5',  descripcion: 'Revancha conseguida en casa ante Vilafranca.' },

    // ── SUB10 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub10.id, rival: 'CB Hospitalet',   fecha: new Date('2025-10-11T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '4-3',  descripcion: 'Primer partido oficial de la temporada. Gran ambiente familiar.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Mataró',       fecha: new Date('2025-10-25T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: '2-5',  descripcion: 'Derrota pero mucho aprendizaje para los más pequeños.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Sabadell',     fecha: new Date('2025-11-08T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '6-1',  descripcion: 'Victoria clara con dos jonrones de los benjamines.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Vilafranca',   fecha: new Date('2025-11-22T10:00:00'), esLocal: false, campo: 'Camp Municipal de Vilafranca', resultado: '3-3',  descripcion: 'Empate divertido. Los niños lo pasan genial jugando.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Terrassa',     fecha: new Date('2025-12-06T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '5-2',  descripcion: 'Buena victoria para cerrar la primera vuelta de los benjamines.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Hospitalet',   fecha: new Date('2026-01-31T10:00:00'), esLocal: false, campo: 'Camp Municipal de Hospitalet', resultado: '2-4',  descripcion: 'Derrota fuera de casa. La defensa sigue mejorando.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Mataró',       fecha: new Date('2026-02-14T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '5-5',  descripcion: 'Empate emocionante con gol en el último inning.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Sabadell',     fecha: new Date('2026-02-28T10:00:00'), esLocal: false, campo: 'Camp Municipal de Sabadell',   resultado: '4-2',  descripcion: 'Victoria importante fuera de casa para el Sub10.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Vilafranca',   fecha: new Date('2026-03-14T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: '3-4',  descripcion: 'Derrota por un run en el último inning. Partido muy disputado.' },

    // ══════════════════════════════════════════════════════════════════
    // PRÓXIMOS PARTIDOS — abril, mayo y junio 2026
    // ══════════════════════════════════════════════════════════════════

    // ── SENIOR ──────────────────────────────────────────────────────
    { categoriaId: categoriaSenior.id, rival: 'CB Sabadell',   fecha: new Date('2026-04-04T11:00:00'), esLocal: false, campo: 'Camp Municipal de Sabadell',   resultado: null, descripcion: null },
    { categoriaId: categoriaSenior.id, rival: 'CB Vilafranca', fecha: new Date('2026-04-18T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Partido de revancha, crucial para mantener el liderato.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Terrassa',   fecha: new Date('2026-05-02T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSenior.id, rival: 'CB Barcelona',  fecha: new Date('2026-05-16T11:00:00'), esLocal: false, campo: 'Camp Municipal de Barcelona',  resultado: null, descripcion: 'Visita al segundo clasificado. Partido decisivo para el título.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Hospitalet', fecha: new Date('2026-05-30T11:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Última jornada regular. El título puede decidirse aquí.' },
    { categoriaId: categoriaSenior.id, rival: 'CB Mollet',     fecha: new Date('2026-06-06T11:00:00'), esLocal: false, campo: 'Camp Municipal de Mollet',     resultado: null, descripcion: 'Partido de playoff si la clasificación lo permite.' },

    // ── SUB18 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub18.id, rival: 'CB Vilafranca', fecha: new Date('2026-04-05T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub18.id, rival: 'CB Badalona',   fecha: new Date('2026-04-19T10:00:00'), esLocal: false, campo: 'Camp Municipal de Badalona',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub18.id, rival: 'CB Sabadell',   fecha: new Date('2026-05-03T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Partido decisivo para la clasificación del Sub18.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Terrassa',   fecha: new Date('2026-05-17T10:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub18.id, rival: 'CB Hospitalet', fecha: new Date('2026-05-31T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Última jornada de la fase regular Sub18.' },
    { categoriaId: categoriaSub18.id, rival: 'CB Mataró',     fecha: new Date('2026-06-07T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: null, descripcion: null },

    // ── SUB16 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub16.id, rival: 'CB Terrassa',   fecha: new Date('2026-04-05T10:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub16.id, rival: 'CB Badalona',   fecha: new Date('2026-04-19T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub16.id, rival: 'CB Mollet',     fecha: new Date('2026-05-03T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mollet',     resultado: null, descripcion: null },
    { categoriaId: categoriaSub16.id, rival: 'CB Sabadell',   fecha: new Date('2026-05-17T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Partido clave para la clasificación Sub16.' },
    { categoriaId: categoriaSub16.id, rival: 'CB Mataró',     fecha: new Date('2026-05-31T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: null, descripcion: null },
    { categoriaId: categoriaSub16.id, rival: 'CB Hospitalet', fecha: new Date('2026-06-07T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Último partido de liga para el Sub16.' },

    // ── SUB14 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub14.id, rival: 'CB Granollers B', fecha: new Date('2026-04-04T10:00:00'), esLocal: false, campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Derby de Granollers, segunda vuelta.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Sabadell',     fecha: new Date('2026-04-18T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub14.id, rival: 'CB Terrassa',     fecha: new Date('2026-05-02T10:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub14.id, rival: 'CB Hospitalet',   fecha: new Date('2026-05-16T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub14.id, rival: 'CB Mataró',       fecha: new Date('2026-05-30T10:00:00'), esLocal: false, campo: 'Camp Municipal de Mataró',     resultado: null, descripcion: 'Penúltimo partido del Sub14.' },
    { categoriaId: categoriaSub14.id, rival: 'CB Vilafranca',   fecha: new Date('2026-06-06T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Final de temporada Sub14.' },

    // ── SUB12 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub12.id, rival: 'CB Terrassa',   fecha: new Date('2026-04-04T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub12.id, rival: 'CB Badalona',   fecha: new Date('2026-04-18T10:00:00'), esLocal: false, campo: 'Camp Municipal de Badalona',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub12.id, rival: 'CB Vilafranca', fecha: new Date('2026-05-02T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub12.id, rival: 'CB Hospitalet', fecha: new Date('2026-05-16T10:00:00'), esLocal: false, campo: 'Camp Municipal de Hospitalet', resultado: null, descripcion: null },
    { categoriaId: categoriaSub12.id, rival: 'CB Mataró',     fecha: new Date('2026-05-30T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Penúltima jornada Sub12.' },
    { categoriaId: categoriaSub12.id, rival: 'CB Terrassa',   fecha: new Date('2026-06-06T10:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',   resultado: null, descripcion: 'Último partido de la temporada Sub12.' },

    // ── SUB10 ──────────────────────────────────────────────────────
    { categoriaId: categoriaSub10.id, rival: 'CB Terrassa',   fecha: new Date('2026-04-04T10:00:00'), esLocal: false, campo: 'Camp Municipal de Terrassa',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub10.id, rival: 'CB Badalona',   fecha: new Date('2026-04-18T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub10.id, rival: 'CB Vilafranca', fecha: new Date('2026-05-02T10:00:00'), esLocal: false, campo: 'Camp Municipal de Vilafranca', resultado: null, descripcion: null },
    { categoriaId: categoriaSub10.id, rival: 'CB Hospitalet', fecha: new Date('2026-05-16T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: null },
    { categoriaId: categoriaSub10.id, rival: 'CB Sabadell',   fecha: new Date('2026-05-30T10:00:00'), esLocal: false, campo: 'Camp Municipal de Sabadell',   resultado: null, descripcion: 'Penúltima jornada de los benjamines.' },
    { categoriaId: categoriaSub10.id, rival: 'CB Mataró',     fecha: new Date('2026-06-06T10:00:00'), esLocal: true,  campo: 'Campo Municipal Granollers',   resultado: null, descripcion: 'Fiesta de fin de temporada Sub10. ¡Todos a animarles!' },
  ];

  // Borramos y recreamos los partidos para asegurar fechas actualizadas
  await prisma.partido.deleteMany({});
  await prisma.partido.createMany({ data: partidosData });
  console.log(`   ✅ ${partidosData.length} partidos creados\n`);

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
