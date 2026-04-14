const prisma = require('../lib/prisma');

const BASE_URL = 'https://cb-granollers.onrender.com';

// ─── Listar noticias ──────────────────────────────────────────────────────────
exports.index = async (req, res) => {
    try {
        const noticias = await prisma.noticia.findMany({
            orderBy: { publicadoEn: 'desc' },
        });

        res.render('noticias/index', {
            title: 'Noticias | CB Granollers',
            description: 'Últimas noticias del Club Béisbol Granollers: resultados, fichajes, eventos y todo lo que pasa en el club.',
            canonical: `${BASE_URL}/noticias`,
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
            where: { id: parseInt(id) },
        });

        if (!noticia) {
            req.flash('error', 'Noticia no encontrada.');
            return res.redirect('/noticias');
        }

        const relacionadas = await prisma.noticia.findMany({
            where: { id: { not: noticia.id } },
            orderBy: { publicadoEn: 'desc' },
            take: 3,
        });

        // Descripción: primer párrafo del resumen o del contenido (máx. 160 chars)
        const rawDesc = noticia.resumen || noticia.contenido || '';
        const seoDesc = rawDesc.replace(/<[^>]+>/g, '').substring(0, 160).trim();

        res.render('noticias/show', {
            title: `${noticia.titulo} | CB Granollers`,
            description: seoDesc || `Noticia del Club Béisbol Granollers: ${noticia.titulo}`,
            canonical: `${BASE_URL}/noticias/${noticia.id}`,
            ogImage: noticia.imagen ? `${BASE_URL}${noticia.imagen}` : undefined,
            noticia,
            relacionadas,
        });
    } catch (error) {
        console.error('Error al cargar noticia:', error);
        req.flash('error', 'Error al cargar la noticia.');
        res.redirect('/noticias');
    }
};
