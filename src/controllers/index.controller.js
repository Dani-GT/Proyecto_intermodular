const prisma = require('../lib/prisma');
const mailer = require('../lib/mailer');

const BASE_URL = 'https://cb-granollers.onrender.com';

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
            description: 'Club Béisbol Granollers — Entrenamiento de élite, instalaciones de primer nivel y una cultura de excelencia. Inscripciones abiertas para la temporada 2026-2027.',
            canonical: `${BASE_URL}/`,
            noticias,
            proximosPartidos,
            ultimosResultados,
            categorias,
        });
    } catch (error) {
        console.error('Error en home:', error);
        res.render('index', {
            title: 'Inicio | Club Béisbol Granollers',
            description: 'Club Béisbol Granollers — Pasión por el béisbol en Granollers desde 1985.',
            canonical: `${BASE_URL}/`,
            noticias: [],
            proximosPartidos: [],
            ultimosResultados: [],
            categorias: [],
        });
    }
};

// ─── Página "Sobre el Club" ───────────────────────────────────────────────────
exports.renderClub = (req, res) => {
    res.render('club', {
        title: 'El Club | CB Granollers',
        description: 'Conoce la historia, los valores y la estructura del Club Béisbol Granollers, fundado en 1985 en Granollers, Barcelona.',
        canonical: `${BASE_URL}/club`,
    });
};

// ─── Página de contacto ───────────────────────────────────────────────────────
exports.renderContacto = (req, res) => {
    res.render('contacto', {
        title: 'Contacto | CB Granollers',
        description: 'Contacta con el Club Béisbol Granollers. Estamos en Granollers, Barcelona. Escríbenos para más información sobre inscripciones y entrenamientos.',
        canonical: `${BASE_URL}/contacto`,
    });
};

exports.procesarContacto = async (req, res) => {
    const { nombre, email, asunto, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
        req.flash('error', 'Por favor, rellena todos los campos obligatorios.');
        return res.redirect('/contacto');
    }

    try {
        await mailer.notificarContacto({ nombre, email, asunto, mensaje });
    } catch (err) {
        console.error('[Contacto] Error enviando email:', err.message);
    }

    req.flash('exito', '¡Mensaje enviado correctamente! Nos pondremos en contacto contigo lo antes posible.');
    res.redirect('/contacto');
};
