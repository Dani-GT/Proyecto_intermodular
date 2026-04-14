const prisma = require('../lib/prisma');

// Calcula la edad en años completos a partir de una fecha
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
}

// ─── Categoría permitida según edad ──────────────────────────────────────────
function categoriaPermitida(nombre, edad) {
    if (edad === null) return true; // sin fecha → mostrar todas por si acaso
    if (nombre === 'SUB10')  return edad <= 10;
    if (nombre === 'SUB12')  return edad >= 11 && edad <= 12;
    if (nombre === 'SUB14')  return edad >= 13 && edad <= 14;
    if (nombre === 'SUB16')  return edad >= 15 && edad <= 16;
    if (nombre === 'SUB18')  return edad >= 17 && edad <= 18;
    if (nombre === 'SENIOR') return edad >= 18;
    return false;
}

// ─── Formulario de inscripción ────────────────────────────────────────────────
exports.showForm = async (req, res) => {
    try {
        // Los administradores y técnicos no pueden inscribirse
        const rol = req.session.usuario?.rol;
        if (rol === 'ADMIN' || rol === 'TECNICO') {
            req.flash('error', 'Los administradores y técnicos no pueden solicitar una inscripción de jugador.');
            return res.redirect(rol === 'ADMIN' ? '/admin/dashboard' : '/auth/perfil');
        }

        // Comprobar si ya tiene inscripción activa (PENDIENTE o APROBADA)
        const inscripcionActiva = await prisma.inscripcion.findFirst({
            where: {
                personaId: req.session.usuario.id,
                estado: { in: ['PENDIENTE', 'APROBADA'] },
            },
            include: { categoria: true },
        });

        if (inscripcionActiva) {
            const msg = inscripcionActiva.estado === 'PENDIENTE'
                ? 'Ya tienes una solicitud de inscripción en curso. Espera a que sea procesada por el equipo del club.'
                : 'Ya estás inscrito/a en el club. No puedes enviar otra solicitud.';
            req.flash('error', msg);
            return res.redirect('/auth/perfil');
        }

        const [todasCategorias, persona] = await Promise.all([
            prisma.categoria.findMany({ orderBy: { nombre: 'asc' } }),
            prisma.persona.findUnique({
                where: { id: req.session.usuario.id },
                select: { fechaNacimiento: true, tutorNombre: true },
            }),
        ]);

        const edad     = calcularEdad(persona?.fechaNacimiento);
        const esMenor  = edad !== null && edad < 18;
        const tieneTutor = !!persona?.tutorNombre; // tutor ya guardado en registro

        // Solo mostrar las categorías que corresponden a la edad del usuario
        const categorias = todasCategorias.filter(c => categoriaPermitida(c.nombre, edad));

        // Mostrar el formulario de tutor solo si es menor Y no tiene tutor guardado
        const mostrarTutor = (esMenor || edad === null) && !tieneTutor;

        res.render('inscripcion/form', {
            title: 'Inscripción | CB Granollers',
            categorias,
            esMenor,
            tieneTutor,
            mostrarTutor,
            edad,
        });
    } catch (error) {
        console.error('Error al cargar formulario de inscripción:', error);
        req.flash('error', 'Error al cargar el formulario.');
        res.redirect('/');
    }
};

// ─── Procesar inscripción ─────────────────────────────────────────────────────
exports.inscribir = async (req, res) => {
    const {
        categoriaId, temporada, notas, rolSolicitado,
        tutorNombre, tutorApellidos, tutorDni, tutorTelefono, tutorFechaNacimiento,
    } = req.body;
    const personaId = req.session.usuario.id;

    try {
        // 0. Bloquear admin y técnico
        const rol = req.session.usuario?.rol;
        if (rol === 'ADMIN' || rol === 'TECNICO') {
            req.flash('error', 'Los administradores y técnicos no pueden inscribirse como jugadores.');
            return res.redirect(rol === 'ADMIN' ? '/admin/dashboard' : '/auth/perfil');
        }

        // 1. Verificar que no haya inscripción activa (PENDIENTE o APROBADA)
        const inscripcionActiva = await prisma.inscripcion.findFirst({
            where: { personaId, estado: { in: ['PENDIENTE', 'APROBADA'] } },
        });
        if (inscripcionActiva) {
            req.flash('error', 'Ya tienes una solicitud en curso o ya estás inscrito/a en el club.');
            return res.redirect('/auth/perfil');
        }

        // 2. Verificar que no exista ya para esa categoría y temporada
        const temporadaFinal = temporada || '2025-2026';
        const existe = await prisma.inscripcion.findFirst({
            where: { personaId, categoriaId: parseInt(categoriaId), temporada: temporadaFinal },
        });
        if (existe) {
            req.flash('error', 'Ya tienes una inscripción registrada en esa categoría para esta temporada.');
            return res.redirect('/inscripcion');
        }

        // 3. Datos del jugador: edad, categoría y tutor
        const persona = await prisma.persona.findUnique({
            where: { id: personaId },
            select: {
                fechaNacimiento: true,
                tutorNombre: true, tutorApellidos: true,
                tutorDni: true,    tutorTelefono: true,
                tutorFechaNacimiento: true,
            },
        });
        const edad     = calcularEdad(persona?.fechaNacimiento);
        const esMenor  = edad !== null && edad < 18;
        const sinFecha = edad === null;

        // 3a. Validar que la categoría seleccionada corresponde a la edad
        const categoriaObj = await prisma.categoria.findUnique({ where: { id: parseInt(categoriaId) } });
        if (categoriaObj && edad !== null && !categoriaPermitida(categoriaObj.nombre, edad)) {
            req.flash('error', `La categoría ${categoriaObj.nombre} no corresponde a tu edad (${edad} años).`);
            return res.redirect('/inscripcion');
        }

        // 3b. Gestión del tutor para menores
        const tieneTutor = !!persona?.tutorNombre; // ya guardado en el registro

        if ((esMenor || sinFecha) && !tieneTutor) {
            // Si no tiene tutor guardado, exigir los datos en el formulario
            const camposFaltantes = [];
            if (!tutorNombre?.trim())           camposFaltantes.push('nombre');
            if (!tutorApellidos?.trim())         camposFaltantes.push('apellidos');
            if (!tutorDni?.trim())               camposFaltantes.push('DNI');
            if (!tutorTelefono?.trim())          camposFaltantes.push('teléfono');
            if (!tutorFechaNacimiento?.trim())   camposFaltantes.push('fecha de nacimiento');

            if (camposFaltantes.length > 0) {
                req.flash('error', `Para menores de edad es obligatorio completar todos los datos del tutor legal. Faltan: ${camposFaltantes.join(', ')}.`);
                return res.redirect('/inscripcion');
            }

            const edadTutor = calcularEdad(tutorFechaNacimiento);
            if (edadTutor === null || edadTutor < 18) {
                req.flash('error', 'El tutor legal debe ser mayor de 18 años.');
                return res.redirect('/inscripcion');
            }
        }

        // 4. Crear inscripción (y tutor si procede)
        await prisma.$transaction(async (tx) => {
            const inscripcion = await tx.inscripcion.create({
                data: {
                    personaId,
                    categoriaId: parseInt(categoriaId),
                    temporada: temporadaFinal,
                    notas: notas || null,
                    estado: 'PENDIENTE',
                    rolSolicitado: (rolSolicitado === 'TECNICO' ? 'TECNICO' : 'JUGADOR'),
                },
            });

            if (esMenor || sinFecha) {
                // Usar datos del tutor del formulario, o los ya guardados en el registro
                const tutorData = tieneTutor ? {
                    nombre:          persona.tutorNombre,
                    apellidos:       persona.tutorApellidos,
                    dni:             persona.tutorDni,
                    telefono:        persona.tutorTelefono || '',
                    fechaNacimiento: persona.tutorFechaNacimiento || new Date('1980-01-01'),
                } : {
                    nombre:          tutorNombre.trim(),
                    apellidos:       tutorApellidos.trim(),
                    dni:             tutorDni.trim().toUpperCase(),
                    telefono:        tutorTelefono.trim(),
                    fechaNacimiento: new Date(tutorFechaNacimiento),
                };
                await tx.tutorLegal.create({
                    data: { inscripcionId: inscripcion.id, ...tutorData },
                });
            }
        });

        req.flash('exito', '¡Solicitud de inscripción enviada! Te contactaremos cuando sea procesada.');
        res.redirect('/auth/perfil');

    } catch (error) {
        console.error('Error en inscripción:', error.message || error);
        const msg = error.message || String(error);
        // Mostrar siempre el error técnico en desarrollo / Supabase no migrado
        req.flash('error', `Error al procesar la inscripción: ${msg}`);
        res.redirect('/inscripcion');
    }
};

// ─── Ver mis inscripciones ─────────────────────────────────────────────────────
exports.misInscripciones = async (req, res) => {
    let inscripciones = [];
    try {
        try {
            inscripciones = await prisma.inscripcion.findMany({
                where: { personaId: req.session.usuario.id },
                include: { categoria: true, tutorLegal: true },
                orderBy: { createdAt: 'desc' },
            });
        } catch (dbError) {
            // Fallback sin tutorLegal por si la tabla no existe aún en la DB
            console.warn('misInscripciones: error con tutorLegal, reintentando sin él:', dbError.message);
            try {
                inscripciones = await prisma.inscripcion.findMany({
                    where: { personaId: req.session.usuario.id },
                    include: { categoria: true },
                    orderBy: { createdAt: 'desc' },
                });
            } catch (fallbackError) {
                console.error('Error crítico al cargar inscripciones:', fallbackError);
                req.flash('error', 'Error al cargar tus inscripciones. Puede que la base de datos necesite actualizarse.');
            }
        }

        res.render('inscripcion/mis-inscripciones', {
            title: 'Mis Inscripciones | CB Granollers',
            inscripciones,
        });
    } catch (error) {
        console.error('Error al cargar inscripciones:', error);
        req.flash('error', 'Error al cargar tus inscripciones.');
        res.redirect('/auth/perfil');
    }
};
