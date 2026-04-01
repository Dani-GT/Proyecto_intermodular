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

// ─── Formulario de inscripción ────────────────────────────────────────────────
exports.showForm = async (req, res) => {
    try {
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

        const [categorias, persona] = await Promise.all([
            prisma.categoria.findMany({ orderBy: { nombre: 'asc' } }),
            prisma.persona.findUnique({ where: { id: req.session.usuario.id }, select: { fechaNacimiento: true } }),
        ]);

        const edad = calcularEdad(persona?.fechaNacimiento);
        const esMenor = edad !== null && edad < 18;
        // Sin fecha de nacimiento, mostramos campos de tutor por precaución
        const mostrarTutor = esMenor || edad === null;

        res.render('inscripcion/form', {
            title: 'Inscripción | CB Granollers',
            categorias,
            esMenor,
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
        tutorNombre, tutorApellidos, tutorDni,
    } = req.body;
    const personaId = req.session.usuario.id;

    try {
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

        // 3. Comprobar si es menor y si se han aportado los datos del tutor
        const persona = await prisma.persona.findUnique({
            where: { id: personaId },
            select: { fechaNacimiento: true },
        });
        const edad = calcularEdad(persona?.fechaNacimiento);
        const esMenor = edad !== null && edad < 18;
        const sinFecha = edad === null;

        // Si es menor o no tiene fecha de nacimiento, los datos del tutor son obligatorios
        if ((esMenor || sinFecha) && (!tutorNombre || !tutorApellidos || !tutorDni)) {
            req.flash('error', 'Para menores de edad es obligatorio indicar los datos del padre/madre o tutor legal (Nombre, Apellidos y DNI).');
            return res.redirect('/inscripcion');
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

            if (tutorNombre && tutorApellidos && tutorDni) {
                await tx.tutorLegal.create({
                    data: {
                        inscripcionId: inscripcion.id,
                        nombre: tutorNombre.trim(),
                        apellidos: tutorApellidos.trim(),
                        dni: tutorDni.trim().toUpperCase(),
                    },
                });
            }
        });

        req.flash('exito', '¡Solicitud de inscripción enviada! Te contactaremos cuando sea procesada.');
        res.redirect('/auth/perfil');

    } catch (error) {
        console.error('Error en inscripción:', error);
        req.flash('error', 'Error al procesar la inscripción. Inténtalo de nuevo.');
        res.redirect('/inscripcion');
    }
};

// ─── Ver mis inscripciones ─────────────────────────────────────────────────────
exports.misInscripciones = async (req, res) => {
    try {
        const inscripciones = await prisma.inscripcion.findMany({
            where: { personaId: req.session.usuario.id },
            include: { categoria: true, tutorLegal: true },
            orderBy: { createdAt: 'desc' },
        });

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
