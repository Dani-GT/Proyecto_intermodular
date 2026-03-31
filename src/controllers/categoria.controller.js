const prisma = require('../lib/prisma');

// ─── Listar categorías ────────────────────────────────────────────────────────
exports.index = async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({
            orderBy: { nombre: 'asc' },
            include: {
                _count: { select: { inscripciones: true } }
            }
        });

        res.render('categorias/index', {
            title: 'Categorías | CB Granollers',
            categorias,
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        req.flash('error', 'Error al cargar las categorías.');
        res.redirect('/');
    }
};

// ─── Detalle de categoría ─────────────────────────────────────────────────────
exports.show = async (req, res) => {
    const { id } = req.params;
    try {
        // Soportar búsqueda por nombre (sub10, senior…) o por id numérico
        const isNumeric = /^\d+$/.test(id);
        const whereClause = isNumeric
            ? { id: parseInt(id) }
            : { nombre: id.toUpperCase() };

        const categoria = await prisma.categoria.findUnique({
            where: whereClause,
            include: {
                partidos: { orderBy: { fecha: 'desc' }, take: 10 },
                inscripciones: {
                    where: { estado: 'APROBADA' },
                    include: {
                        persona: {
                            select: { id: true, nombre: true, apellidos: true, rol: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.');
            return res.redirect('/categorias');
        }

        // Separar jugadores y técnicos
        const jugadores = categoria.inscripciones.filter(i =>
            i.persona.rol && (i.persona.rol.tipo === 'JUGADOR')
        );
        const tecnicos = categoria.inscripciones.filter(i =>
            i.persona.rol && (i.persona.rol.tipo === 'TECNICO')
        );

        res.render('categorias/show', {
            title: `${categoria.nombre} | CB Granollers`,
            categoria,
            inscripciones: categoria.inscripciones,
            jugadores,
            tecnicos,
        });
    } catch (error) {
        console.error('Error al cargar categoría:', error);
        req.flash('error', 'Error al cargar la categoría.');
        res.redirect('/categorias');
    }
};

// ─── Resultados globales ─────────────────────────────────────────────────────
exports.resultados = async (req, res) => {
    try {
        const partidos = await prisma.partido.findMany({
            where: { resultado: { not: null } },
            orderBy: { fecha: 'desc' },
            include: { categoria: true },
            take: 30,
        });

        res.render('categorias/resultados', {
            title: 'Resultados | CB Granollers',
            partidos,
        });
    } catch (error) {
        console.error('Error al cargar resultados:', error);
        req.flash('error', 'Error al cargar los resultados.');
        res.redirect('/');
    }
};

// ─── Calendario global ───────────────────────────────────────────────────────
exports.calendario = async (req, res) => {
    try {
        const partidos = await prisma.partido.findMany({
            where: {
                resultado: null,
                fecha: { gte: new Date() }
            },
            orderBy: { fecha: 'asc' },
            include: { categoria: true },
        });

        res.render('categorias/calendario', {
            title: 'Calendario | CB Granollers',
            partidos,
        });
    } catch (error) {
        console.error('Error al cargar calendario:', error);
        req.flash('error', 'Error al cargar el calendario.');
        res.redirect('/');
    }
};

// ─── Calendario de una categoría concreta ─────────────────────────────────────
exports.calendarioCategoria = async (req, res) => {
    const { nombre } = req.params;
    try {
        const categoria = await prisma.categoria.findUnique({
            where: { nombre: nombre.toUpperCase() }
        });

        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.');
            return res.redirect('/categorias');
        }

        // Cargar TODOS los partidos para que los filtros funcionen
        const partidos = await prisma.partido.findMany({
            where: {
                resultado: null,
                fecha: { gte: new Date() }
            },
            orderBy: { fecha: 'asc' },
            include: { categoria: true },
        });

        res.render('categorias/calendario', {
            title: `Calendario ${categoria.nombre} | CB Granollers`,
            partidos,
            categoriaFiltro: categoria,
        });
    } catch (error) {
        console.error('Error al cargar calendario de categoría:', error);
        req.flash('error', 'Error al cargar el calendario.');
        res.redirect('/categorias');
    }
};

// ─── Resultados de una categoría concreta ─────────────────────────────────────
exports.resultadosCategoria = async (req, res) => {
    const { nombre } = req.params;
    try {
        const categoria = await prisma.categoria.findUnique({
            where: { nombre: nombre.toUpperCase() }
        });

        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.');
            return res.redirect('/categorias');
        }

        // Cargar TODOS los resultados para que los filtros funcionen
        const partidos = await prisma.partido.findMany({
            where: {
                resultado: { not: null }
            },
            orderBy: { fecha: 'desc' },
            include: { categoria: true },
            take: 50,
        });

        res.render('categorias/resultados', {
            title: `Resultados ${categoria.nombre} | CB Granollers`,
            partidos,
            categoriaFiltro: categoria,
        });
    } catch (error) {
        console.error('Error al cargar resultados de categoría:', error);
        req.flash('error', 'Error al cargar los resultados.');
        res.redirect('/categorias');
    }
};
