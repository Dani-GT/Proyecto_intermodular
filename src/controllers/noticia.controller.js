const prisma = require('../lib/prisma');

// ─── Listar noticias ──────────────────────────────────────────────────────────
exports.index = async (req, res) => {
    try {
        const noticias = await prisma.noticia.findMany({
            where: { publicada: true },
            orderBy: { createdAt: 'desc' },
            include: { autor: { select: { nombre: true, apellidos: true } } }
        });

        res.render('noticias/index', {
            title: 'Noticias | CB Granollers',
            noticias,
        });
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        req.flash('error', 'Error al cargar las noticias.');
        res.redirect('/');
    }
};

// ─── Detalle de noticia ───────────────────────────────────────────────────────
exports.show = async (req, res) => {
    const { id } = req.params;
    try {
        const noticia = await prisma.noticia.findUnique({
            where: { id: parseInt(id), publicada: true },
            include: { autor: { select: { nombre: true, apellidos: true } } }
        });

        if (!noticia) {
            req.flash('error', 'Noticia no encontrada.');
            return res.redirect('/noticias');
        }

        const relacionadas = await prisma.noticia.findMany({
            where: { publicada: true, id: { not: noticia.id } },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });

        res.render('noticias/show', {
            title: `${noticia.titulo} | CB Granollers`,
            noticia,
            relacionadas,
        });
    } catch (error) {
        console.error('Error al cargar noticia:', error);
        req.flash('error', 'Error al cargar la noticia.');
        res.redirect('/noticias');
    }
};
