const prisma = require('../lib/prisma');

// ─── Listar categorías ────────────────────────────────────────────────────────
exports.index = async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({
            where: { activa: true },
            include: {
                _count: { select: { inscripciones: true } }
            },
            orderBy: { nombre: 'asc' }
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
        const categoria = await prisma.categoria.findUnique({
            where: { id: parseInt(id) },
            include: {
                partidos: {
                    orderBy: { fecha: 'desc' },
                    take: 10,
                }
            }
        });

        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.');
            return res.redirect('/categorias');
        }

        res.render('categorias/show', {
            title: `${categoria.nombre} | CB Granollers`,
            categoria,
        });
    } catch (error) {
        console.error('Error al cargar categoría:', error);
        req.flash('error', 'Error al cargar la categoría.');
        res.redirect('/categorias');
    }
};

// ─── Resultados de partidos ───────────────────────────────────────────────────
exports.resultados = async (req, res) => {
    try {
        const partidos = await prisma.partido.findMany({
            where: { finalizado: true },
            orderBy: { fecha: 'desc' },
            include: { categoria: true },
            take: 20,
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

// ─── Calendario de partidos ────────────────────────────────────────────────────
exports.calendario = async (req, res) => {
    try {
        const partidos = await prisma.partido.findMany({
            where: { fecha: { gte: new Date() }, finalizado: false },
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
