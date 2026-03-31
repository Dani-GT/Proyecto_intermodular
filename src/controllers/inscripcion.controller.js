const prisma = require('../lib/prisma');

// ─── Formulario de inscripción ────────────────────────────────────────────────
exports.showForm = async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({
            orderBy: { nombre: 'asc' }
        });

        res.render('inscripcion/form', {
            title: 'Inscripción | CB Granollers',
            categorias,
        });
    } catch (error) {
        console.error('Error al cargar formulario de inscripción:', error);
        req.flash('error', 'Error al cargar el formulario.');
        res.redirect('/');
    }
};

// ─── Procesar inscripción ─────────────────────────────────────────────────────
exports.inscribir = async (req, res) => {
    const { categoriaId, temporada, notas } = req.body;
    const personaId = req.session.usuario.id;

    try {
        const temporadaFinal = temporada || '2025-2026';

        // Verificar si ya está inscrito en esa categoría y temporada
        const inscripcionExistente = await prisma.inscripcion.findFirst({
            where: {
                personaId,
                categoriaId: parseInt(categoriaId),
                temporada: temporadaFinal,
            }
        });

        if (inscripcionExistente) {
            req.flash('error', 'Ya estás inscrito en esta categoría para esta temporada.');
            return res.redirect('/inscripcion');
        }

        await prisma.inscripcion.create({
            data: {
                personaId,
                categoriaId: parseInt(categoriaId),
                temporada: temporadaFinal,
                notas: notas || null,
                estado: 'PENDIENTE',
            }
        });

        req.flash('exito', '¡Inscripción realizada con éxito! Te contactaremos pronto para confirmarla.');
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
            include: { categoria: true },
            orderBy: { createdAt: 'desc' }
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
