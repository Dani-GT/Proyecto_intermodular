const prisma = require('../lib/prisma');

// ─── Dashboard ─────────────────────────────────────────────────────────────────
exports.dashboard = async (req, res) => {
    try {
        const [totalPersonas, totalInscripciones, totalCompras, totalProductos,
               ultimasInscripciones, ultimasCompras] = await Promise.all([
            prisma.persona.count(),
            prisma.inscripcion.count(),
            prisma.compra.count(),
            prisma.producto.count(),
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
            usuarios: personas,
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
        let inscripciones = [];
        try {
            inscripciones = await prisma.inscripcion.findMany({
                include: {
                    persona: { select: { id: true, nombre: true, apellidos: true, email: true, fechaNacimiento: true, rol: true } },
                    categoria: true,
                    tutorLegal: true,
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (dbError) {
            // Fallback sin tutorLegal si la tabla aún no existe en la DB
            console.warn('Admin inscripciones: error con tutorLegal, reintentando sin él:', dbError.message);
            inscripciones = await prisma.inscripcion.findMany({
                include: {
                    persona: { select: { id: true, nombre: true, apellidos: true, email: true, fechaNacimiento: true, rol: true } },
                    categoria: true,
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        const categorias = await prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });

        res.render('admin/inscripciones', {
            title: 'Inscripciones | Admin CB Granollers',
            inscripciones,
            categorias,
        });
    } catch (error) {
        console.error('Error al cargar inscripciones:', error);
        req.flash('error', 'Error al cargar las inscripciones.');
        res.redirect('/admin/dashboard');
    }
};

// ─── Actualizar estado de inscripción ─────────────────────────────────────────
// Al APROBAR: cambia el rol de la persona de SOCIO → rolSolicitado (JUGADOR/TECNICO)
// Al RECHAZAR: vuelve el rol a SOCIO si seguía siendo SOCIO
exports.updateInscripcion = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        await prisma.$transaction(async (tx) => {
            const inscripcion = await tx.inscripcion.update({
                where: { id: parseInt(id) },
                data: { estado },
                include: { persona: { include: { rol: true } } },
            });

            if (estado === 'APROBADA') {
                // Cambiar rol a lo que el usuario solicitó (JUGADOR o TECNICO)
                const nuevoRol = inscripcion.rolSolicitado || 'JUGADOR';
                await tx.rol.update({
                    where: { personaId: inscripcion.personaId },
                    data: { tipo: nuevoRol },
                });
            } else if (estado === 'RECHAZADA') {
                // Si el rol actual aún es JUGADOR o TECNICO y fue por esta inscripción,
                // devolver a SOCIO solo si no tiene otra inscripción aprobada
                const otraAprobada = await tx.inscripcion.findFirst({
                    where: {
                        personaId: inscripcion.personaId,
                        estado: 'APROBADA',
                        id: { not: parseInt(id) },
                    },
                });
                if (!otraAprobada) {
                    await tx.rol.update({
                        where: { personaId: inscripcion.personaId },
                        data: { tipo: 'SOCIO' },
                    });
                }
            }
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
    const { nombre, descripcion, precio, stock, categoria } = req.body;

    try {
        // Si se subió un archivo: Cloudinary devuelve URL en req.file.path; disco local usa filename
        const imagenUrl = req.file
            ? (req.file.path?.startsWith('http') ? req.file.path : `/images/productos/${req.file.filename}`)
            : (req.body.imagenUrl || null);

        await prisma.producto.create({
            data: {
                nombre,
                descripcion: descripcion || null,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                categoria,
                imagen: imagenUrl,
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
    const { nombre, descripcion, precio, stock, categoria } = req.body;

    try {
        const productoActual = await prisma.producto.findUnique({ where: { id: parseInt(id) } });

        // Si se sube nueva imagen, usarla; si no, conservar la actual
        const imagenUrl = req.file
            ? (req.file.path?.startsWith('http') ? req.file.path : `/images/productos/${req.file.filename}`)
            : (req.body.imagenUrl || productoActual?.imagen || null);

        await prisma.producto.update({
            where: { id: parseInt(id) },
            data: {
                nombre,
                descripcion: descripcion || null,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                categoria,
                imagen: imagenUrl,
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
            // autor es campo String, sin include
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
    const { titulo, resumen, contenido, publicada, publicadoEn, autor } = req.body;

    try {
        const imagenUrl = req.file
            ? (req.file.path?.startsWith('http') ? req.file.path : `/images/noticias/${req.file.filename}`)
            : (req.body.imagenUrl || null);

        await prisma.noticia.create({
            data: {
                titulo,
                resumen: resumen || null,
                contenido,
                imagen: imagenUrl,
                destacada: publicada === 'true',
                autor: autor || req.session.usuario.nombre || 'Admin',
                publicadoEn: publicadoEn ? new Date(publicadoEn) : new Date(),
            }
        });

        req.flash('exito', 'Noticia publicada correctamente.');
        res.redirect('/admin/noticias');
    } catch (error) {
        console.error('Error al crear noticia:', error);
        req.flash('error', 'Error al crear la noticia.');
        res.redirect('/admin/noticias');
    }
};

// ─── Actualizar noticia ────────────────────────────────────────────────────────
exports.updateNoticia = async (req, res) => {
    const { id } = req.params;
    const { titulo, resumen, contenido, publicada, autor } = req.body;

    try {
        const noticiaActual = await prisma.noticia.findUnique({ where: { id: parseInt(id) } });

        const imagenUrl = req.file
            ? (req.file.path?.startsWith('http') ? req.file.path : `/images/noticias/${req.file.filename}`)
            : (req.body.imagenUrl || noticiaActual?.imagen || null);

        await prisma.noticia.update({
            where: { id: parseInt(id) },
            data: {
                titulo,
                resumen: resumen || null,
                contenido,
                imagen: imagenUrl,
                destacada: publicada === 'true',
                autor: autor || noticiaActual?.autor,
            }
        });

        req.flash('exito', 'Noticia actualizada correctamente.');
        res.redirect('/admin/noticias');
    } catch (error) {
        console.error('Error al actualizar noticia:', error);
        req.flash('error', 'Error al actualizar la noticia.');
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
            prisma.categoria.findMany({ orderBy: { nombre: 'asc' } })
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
    const { rival, fecha, campo, lugar, esLocal, categoriaId } = req.body;

    try {
        await prisma.partido.create({
            data: {
                rival,
                fecha: new Date(fecha),
                campo: campo || lugar || null,   // acepta ambos nombres por retrocompatibilidad
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
    const { resultado, descripcion } = req.body;

    try {
        await prisma.partido.update({
            where: { id: parseInt(id) },
            data: {
                resultado: resultado && resultado.trim() !== '' ? resultado.trim() : null,
                descripcion: descripcion && descripcion.trim() !== '' ? descripcion.trim() : null,
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

// ─── Crear jugador/técnico desde admin ────────────────────────────────────────
exports.createJugador = async (req, res) => {
    const { nombre, apellidos, email, password, fechaNacimiento, telefono, rol, categoriaId, temporada } = req.body;

    try {
        const bcrypt = require('bcryptjs');

        // La contraseña es obligatoria — no se permite fallback público
        if (!password || password.trim().length < 8) {
            req.flash('error', 'La contraseña es obligatoria y debe tener al menos 8 caracteres.');
            return res.redirect('/admin/inscripciones');
        }

        // Verificar que no exista el email
        const existente = await prisma.persona.findUnique({ where: { email } });
        if (existente) {
            req.flash('error', `Ya existe un usuario con el email ${email}.`);
            return res.redirect('/admin/inscripciones');
        }

        const hash = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            const persona = await tx.persona.create({
                data: {
                    nombre,
                    apellidos,
                    email,
                    password: hash,
                    telefono: telefono || null,
                    fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
                    rol: { create: { tipo: rol || 'JUGADOR' } },
                },
            });

            if (categoriaId) {
                await tx.inscripcion.create({
                    data: {
                        personaId: persona.id,
                        categoriaId: parseInt(categoriaId),
                        temporada: temporada || '2025-2026',
                        estado: 'APROBADA',
                    },
                });
            }
        });

        req.flash('exito', `${rol === 'TECNICO' ? 'Técnico' : 'Jugador'} ${nombre} ${apellidos} creado correctamente.`);
        res.redirect('/admin/inscripciones');
    } catch (error) {
        console.error('Error al crear jugador:', error);
        req.flash('error', 'Error al crear el jugador. Revisa los datos.');
        res.redirect('/admin/inscripciones');
    }
};

// ─── Eliminar inscripción ─────────────────────────────────────────────────────
exports.deleteInscripcion = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.inscripcion.delete({ where: { id: parseInt(id) } });
        req.flash('exito', 'Inscripción eliminada correctamente.');
        res.redirect('/admin/inscripciones');
    } catch (error) {
        console.error('Error al eliminar inscripción:', error);
        req.flash('error', 'Error al eliminar la inscripción.');
        res.redirect('/admin/inscripciones');
    }
};

// ─── Eliminar usuario (persona) ───────────────────────────────────────────────
exports.deleteUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.persona.delete({ where: { id: parseInt(id) } });
        req.flash('exito', 'Usuario eliminado correctamente.');
        res.redirect('/admin/usuarios');
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        req.flash('error', 'No se pudo eliminar el usuario.');
        res.redirect('/admin/usuarios');
    }
};
