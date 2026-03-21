const prisma = require('../lib/prisma');

// ─── Página principal ─────────────────────────────────────────────────────────
exports.renderHome = async (req, res) => {
    try {
        const [noticias, proximosPartidos, categorias] = await Promise.all([
            prisma.noticia.findMany({
                where: { publicada: true },
                orderBy: { createdAt: 'desc' },
                take: 3,
                include: { autor: { select: { nombre: true } } }
            }),
            prisma.partido.findMany({
                where: { fecha: { gte: new Date() }, finalizado: false },
                orderBy: { fecha: 'asc' },
                take: 3,
                include: { categoria: true }
            }),
            prisma.categoria.findMany({
                where: { activa: true },
                orderBy: { nombre: 'asc' }
            })
        ]);

        res.render('index', {
            title: 'Inicio | Club Béisbol Granollers',
            noticias,
            proximosPartidos,
            categorias,
        });
    } catch (error) {
        console.error('Error en home:', error);
        res.render('index', {
            title: 'Inicio | Club Béisbol Granollers',
            noticias: [],
            proximosPartidos: [],
            categorias: [],
        });
    }
};

// ─── Página "Sobre el Club" ───────────────────────────────────────────────────
exports.renderClub = (req, res) => {
    res.render('club', { title: 'El Club | CB Granollers' });
};

// ─── Página de contacto ───────────────────────────────────────────────────────
exports.renderContacto = (req, res) => {
    res.render('contacto', { title: 'Contacto | CB Granollers' });
};
