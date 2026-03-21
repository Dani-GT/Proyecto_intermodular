const prisma = require('../lib/prisma');

// ─── Dashboard ─────────────────────────────────────────────────────────────────
exports.dashboard = async (req, res) => {
    try {
        const [totalPersonas, totalInscripciones, totalCompras, totalProductos,
               ultimasInscripciones, ultimasCompras] = await Promise.all([
            prisma.persona.count(),
            prisma.inscripcion.count(),
            prisma.compra.count(),
            prisma.producto.count({ where: { activo: true } }),
            prisma.inscripcion.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { persona: { select: { nombre: true, apellidos: true } }, categoria: true }
            }),
            prisma.compra.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { persona: { select: { nombre: true, apellidos: true } } }
            }),
        ]);

        res.render('admin/dashboard', {
            title: 'Panel Admin | CB Granollers',
            stats: { totalPersonas, totalInscripciones, totalCompras, totalProductos },
            ultimasInscripciones,
            ultimasCompras,
        });
    } catch (error) {
        console.error('Error en dashboard:', error);
        req.flash('error', 'Error al cargar el panel de administración.');
        res.redirect('/');
    }
};

// ─── Gestión de usuarios ───────────────────────────────────────────────────────
exports.usuarios = async (req, res) => {
    try {
        const personas = await prisma.persona.findMany({
            include: { rol: true },
            orderBy: { createdAt: 'desc' }
        });

        res.render('admin/usuarios', {
            title: 'Usuarios | Admin CB Granollers',
            personas,
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        req.flash('error', 'Error al cargar los usuarios.');
        res.redirect('/admin/dashboard');
    }
};

// ─── Cambiar rol de usuario ────────────────────────────────────────────────────
exports.cambiarRol = async (req, res) => {
    const { id } = req.params;
    const { tipo } = req.body;

    try {
        await prisma.rol.update({
            where: { personaId: parseInt(id) },
            data: { tipo }
        });

        req.flash('exito', 'Rol actualizado correctamente.');
        res.redirect('/admin/usuarios');
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        req.flash('error', 'Error al actualizar el rol.');
        res.redirect('/admin/usuarios');
    }
};

// ─── Gestión de inscripciones ─────────────────────────────────────────────────
exports.inscripciones = async (req, res) => {
    try {
        const inscripciones = await prisma.inscripcion.findMany({
            include: {
                persona: { select: { nombre: true, apellidos: true, email: true } },
                categoria: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.render('admin/inscripciones', {
            title: 'Inscripciones | Admin CB Granollers',
            inscripciones,
        });
    } catch (error) {
        console.error('Error al cargar inscripciones:', error);
        req.flash('error', 'Error al cargar las inscripciones.');
        res.redirect('/admin/dashboard');
    }
};

// ─── Actualizar estado de inscripción ─────────────────────────────────────────
exports.updateInscripcion = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        await prisma.inscripcion.update({
            where: { id: parseInt(id) },
            data: { estado }
        });

        req.flash('exito', 'Estado de inscripción actualizado.');
        res.redirect('/admin/inscripciones');
    } catch (error) {
        console.error('Error al actualizar inscripción:', error);
        req.flash('error', 'Error al actualizar la inscripción.');
        res.redirect('/admin/inscripciones');
    }
};

// ─── Gestión de productos ─────────────────────────────────────────────────────
exports.productos = async (req, res) => {
    try {
        const productos = await prisma.producto.findMany({
            orderBy: { createdAt: 'desc' }
        });

        res.render('admin/productos', {
            title: 'Productos | Admin CB Granollers',
            productos,
            categorias: ['UNIFORME', 'EQUIPAMIENTO', 'ACCESORIO', 'OTRO'],
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
        req.flash('error', 'Error al cargar los productos.');
        res.redirect('/admin/dashboard');
    }
};

// ─── Crear producto ────────────────────────────────────────────────────────────
exports.createProducto = async (req, res) => {
    const { nombre, descripcion, precio, stock, categoria, imagen } = req.body;

    try {
        await prisma.producto.create({
            data: {
                nombre,
                descripcion: descripcion || null,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                categoria,
                imagen: imagen || null,
            }
        });

        req.flash('exito', 'Producto creado correctamente.');
        res.redirect('/admin/productos');
    } catch (error) {
        console.error('Error al crear producto:', error);
        req.flash('error', 'Error al crear el producto.');
        res.redirect('/admin/productos');
    }
};

// ─── Actualizar producto ───────────────────────────────────────────────────────
exports.updateProducto = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria, activo } = req.body;

    try {
        await prisma.producto.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion: descripcion || null,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                categoria,
                activo: activo === 'true',
            }
        });

        req.flash('exito', 'Producto actualizado correctamente.');
        res.redirect('/admin/productos');
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        req.flash('error', 'Error al actualizar el producto.');
        res.redirect('/admin/productos');
    }
};

// ─── Gestión de noticias ───────────────────────────────────────────────────────
exports.noticias = async (req, res) => {
    try {
        const noticias = await prisma.noticia.findMany({
            include: { autor: { select: { nombre: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.render('admin/noticias', {
            title: 'Noticias | Admin CB Granollers',
            noticias,
        });
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        req.flash('error', 'Error al cargar las noticias.');
        res.redirect('/admin/dashboard');
    }
};

// ─── Crear noticia ─────────────────────────────────────────────────────────────
exports.createNoticia = async (req, res) => {
    const { titulo, contenido, imagen, publicada } = req.body;

    try {
        await prisma.noticia.create({
            data: {
                titulo,
                contenido,
                imagen: imagen || null,
                publicada: publicada === 'true',
                autorId: req.session.usuario.id,
            }
        });

        req.flash('exito', 'Noticia creada correctamente.');
        res.redirect('/admin/noticias');
    } catch (error) {
        console.error('Error al crear noticia:', error);
        req.flash('error', 'Error al crear la noticia.');
        res.redirect('/admin/noticias');
    }
};

// ─── Gestión de partidos ───────────────────────────────────────────────────────
exports.partidos = async (req, res) => {
    try {
        const [partidos, categorias] = await Promise.all([
            prisma.partido.findMany({
                include: { categoria: true },
                orderBy: { fecha: 'desc' }
            }),
            prisma.categoria.findMany({ where: { activa: true } })
        ]);

        res.render('admin/partidos', {
            title: 'Partidos | Admin CB Granollers',
            partidos,
            categorias,
        });
    } catch (error) {
        console.error('Error al cargar partidos:', error);
        req.flash('error', 'Error al cargar los partidos.');
        res.redirect('/admin/dashboard');
    }
};

// ─── Crear partido ─────────────────────────────────────────────────────────────
exports.createPartido = async (req, res) => {
    const { rival, fecha, lugar, esLocal, categoriaId } = req.body;

    try {
        await prisma.partido.create({
            data: {
                rival,
                fecha: new Date(fecha),
                lugar,
                esLocal: esLocal === 'true',
                categoriaId: parseInt(categoriaId),
            }
        });

        req.flash('exito', 'Partido creado correctamente.');
        res.redirect('/admin/partidos');
    } catch (error) {
        console.error('Error al crear partido:', error);
        req.flash('error', 'Error al crear el partido.');
        res.redirect('/admin/partidos');
    }
};

// ─── Registrar resultado de partido ───────────────────────────────────────────
exports.updatePartido = async (req, res) => {
    const { id } = req.params;
    const { golesFavor, golesContra, finalizado } = req.body;

    try {
        await prisma.partido.update({
            where: { id: parseInt(id) },
            data: {
                golesFavor: golesFavor !== '' ? parseInt(golesFavor) : null,
                golesContra: golesContra !== '' ? parseInt(golesContra) : null,
                finalizado: finalizado === 'true',
            }
        });

        req.flash('exito', 'Partido actualizado correctamente.');
        res.redirect('/admin/partidos');
    } catch (error) {
        console.error('Error al actualizar partido:', error);
        req.flash('error', 'Error al actualizar el partido.');
        res.redirect('/admin/partidos');
    }
};
