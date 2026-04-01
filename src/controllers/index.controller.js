const prisma = require('../lib/prisma');

// ─── Página principal ─────────────────────────────────────────────────────────
exports.renderHome = async (req, res) => {
    try {
        const [noticias, proximosPartidos, ultimosResultados, categorias] = await Promise.all([
            prisma.noticia.findMany({
                orderBy: { publicadoEn: 'desc' },
                take: 3,
            }),
            prisma.partido.findMany({
                where: { resultado: null, fecha: { gte: new Date() } },
                orderBy: { fecha: 'asc' },
                take: 4,
                include: { categoria: true }
            }),
            prisma.partido.findMany({
                where: { resultado: { not: null } },
                orderBy: { fecha: 'desc' },
                take: 4,
                include: { categoria: true }
            }),
            prisma.categoria.findMany({
                orderBy: { nombre: 'asc' }
            })
        ]);

        res.render('index', {
            title: 'Inicio | Club Béisbol Granollers',
            noticias,
            proximosPartidos,
            ultimosResultados,
            categorias,
        });
    } catch (error) {
        console.error('Error en home:', error);
        res.render('index', {
            title: 'Inicio | Club Béisbol Granollers',
            noticias: [],
            proximosPartidos: [],
            ultimosResultados: [],
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
