const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

// ─── Mostrar formulario de registro ──────────────────────────────────────────
exports.showRegister = (req, res) => {
    res.render('auth/registro', { title: 'Registro | CB Granollers' });
};

// ─── Procesar registro ────────────────────────────────────────────────────────
exports.register = async (req, res) => {
    const { nombre, apellidos, email, password, confirmarPassword, fechaNacimiento, telefono } = req.body;

    try {
        // Validaciones básicas
        if (!nombre || !apellidos || !email || !password) {
            req.flash('error', 'Todos los campos obligatorios deben estar completos.');
            return res.redirect('/auth/registro');
        }

        if (password !== confirmarPassword) {
            req.flash('error', 'Las contraseñas no coinciden.');
            return res.redirect('/auth/registro');
        }

        if (password.length < 8) {
            req.flash('error', 'La contraseña debe tener al menos 8 caracteres.');
            return res.redirect('/auth/registro');
        }

        // Verificar email duplicado
        const existente = await prisma.persona.findUnique({ where: { email } });
        if (existente) {
            req.flash('error', 'Ya existe una cuenta con ese correo electrónico.');
            return res.redirect('/auth/registro');
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Crear persona y rol en una transacción
        const nuevaPersona = await prisma.$transaction(async (tx) => {
            const persona = await tx.persona.create({
                data: {
                    nombre,
                    apellidos,
                    email,
                    password: passwordHash,
                    fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
                    telefono: telefono || null,
                }
            });

            await tx.rol.create({
                data: {
                    tipo: 'SOCIO',
                    personaId: persona.id,
                }
            });

            return persona;
        });

        // Iniciar sesión automáticamente
        req.session.usuario = {
            id: nuevaPersona.id,
            nombre: nuevaPersona.nombre,
            apellidos: nuevaPersona.apellidos,
            email: nuevaPersona.email,
            rol: 'SOCIO',
        };

        req.flash('exito', `¡Bienvenido/a al club, ${nuevaPersona.nombre}!`);
        res.redirect('/');

    } catch (error) {
        console.error('Error en registro:', error);
        req.flash('error', 'Ha ocurrido un error. Por favor, inténtalo de nuevo.');
        res.redirect('/auth/registro');
    }
};

// ─── Mostrar formulario de login ──────────────────────────────────────────────
exports.showLogin = (req, res) => {
    res.render('auth/login', { title: 'Iniciar Sesión | CB Granollers' });
};

// ─── Procesar login ───────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            req.flash('error', 'Introduce tu correo y contraseña.');
            return res.redirect('/auth/login');
        }

        const persona = await prisma.persona.findUnique({
            where: { email },
            include: { rol: true }
        });

        if (!persona) {
            req.flash('error', 'Correo o contraseña incorrectos.');
            return res.redirect('/auth/login');
        }

        const passwordValido = await bcrypt.compare(password, persona.password);
        if (!passwordValido) {
            req.flash('error', 'Correo o contraseña incorrectos.');
            return res.redirect('/auth/login');
        }

        req.session.usuario = {
            id: persona.id,
            nombre: persona.nombre,
            apellidos: persona.apellidos,
            email: persona.email,
            rol: persona.rol?.tipo || 'SOCIO',
        };

        req.flash('exito', `¡Bienvenido/a de nuevo, ${persona.nombre}!`);

        // Redirigir según rol
        if (persona.rol?.tipo === 'ADMIN') {
            return res.redirect('/admin/dashboard');
        }
        res.redirect('/');

    } catch (error) {
        console.error('Error en login:', error);
        req.flash('error', 'Ha ocurrido un error. Por favor, inténtalo de nuevo.');
        res.redirect('/auth/login');
    }
};

// ─── Cerrar sesión ────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Error al cerrar sesión:', err);
        res.redirect('/');
    });
};

// ─── Perfil del usuario ───────────────────────────────────────────────────────
exports.showPerfil = async (req, res) => {
    let persona = null;
    let inscripciones = [];
    let compras = [];

    try {
        // Intento completo con inscripciones y tutor legal
        try {
            persona = await prisma.persona.findUnique({
                where: { id: req.session.usuario.id },
                include: {
                    rol: true,
                    inscripciones: { include: { categoria: true, tutorLegal: true }, orderBy: { createdAt: 'desc' } },
                    compras: { include: { CompraProducto: { include: { producto: true } } } },
                }
            });
            if (persona) {
                inscripciones = persona.inscripciones || [];
                compras = persona.compras || [];
            }
        } catch (dbError) {
            // Fallback: puede que la DB no tenga aún las columnas rolSolicitado / tabla tutores_legales
            console.warn('Perfil: error al cargar inscripciones, usando fallback sin inscripciones:', dbError.message);
            persona = await prisma.persona.findUnique({
                where: { id: req.session.usuario.id },
                include: {
                    rol: true,
                    compras: { include: { CompraProducto: { include: { producto: true } } } },
                }
            });
            if (persona) compras = persona.compras || [];
        }

        // Refrescar el rol en la sesión por si fue actualizado por el admin
        if (persona && persona.rol) {
            req.session.usuario.rol = persona.rol.tipo;
        }

        res.render('auth/perfil', {
            title: 'Mi Perfil | CB Granollers',
            persona,
            inscripciones,
            compras,
        });
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        req.flash('error', 'Error al cargar el perfil.');
        res.redirect('/');
    }
};

// ─── Actualizar datos del perfil propio ───────────────────────────────────────
exports.updatePerfil = async (req, res) => {
    const { nombre, apellidos, telefono, fechaNacimiento } = req.body;
    const personaId = req.session.usuario.id;

    try {
        if (!nombre || !apellidos) {
            req.flash('error', 'El nombre y los apellidos son obligatorios.');
            return res.redirect('/auth/perfil');
        }

        const persona = await prisma.persona.update({
            where: { id: personaId },
            data: {
                nombre: nombre.trim(),
                apellidos: apellidos.trim(),
                telefono: telefono?.trim() || null,
                fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
            },
        });

        // Actualizar sesión con los nuevos datos
        req.session.usuario = {
            ...req.session.usuario,
            nombre: persona.nombre,
            apellidos: persona.apellidos,
        };

        req.flash('exito', 'Datos actualizados correctamente.');
        res.redirect('/auth/perfil');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        req.flash('error', 'Error al actualizar los datos.');
        res.redirect('/auth/perfil');
    }
};

// ─── Cambiar contraseña propia ────────────────────────────────────────────────
exports.updatePassword = async (req, res) => {
    const { passwordActual, passwordNueva, passwordConfirmar } = req.body;
    const personaId = req.session.usuario.id;

    try {
        if (!passwordActual || !passwordNueva || !passwordConfirmar) {
            req.flash('error', 'Todos los campos de contraseña son obligatorios.');
            return res.redirect('/auth/perfil');
        }
        if (passwordNueva !== passwordConfirmar) {
            req.flash('error', 'La contraseña nueva y su confirmación no coinciden.');
            return res.redirect('/auth/perfil');
        }
        if (passwordNueva.length < 8) {
            req.flash('error', 'La contraseña debe tener al menos 8 caracteres.');
            return res.redirect('/auth/perfil');
        }

        const persona = await prisma.persona.findUnique({ where: { id: personaId } });
        const valida = await bcrypt.compare(passwordActual, persona.password);
        if (!valida) {
            req.flash('error', 'La contraseña actual no es correcta.');
            return res.redirect('/auth/perfil');
        }

        const hash = await bcrypt.hash(passwordNueva, 12);
        await prisma.persona.update({ where: { id: personaId }, data: { password: hash } });

        req.flash('exito', 'Contraseña actualizada correctamente.');
        res.redirect('/auth/perfil');
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        req.flash('error', 'Error al cambiar la contraseña.');
        res.redirect('/auth/perfil');
    }
};
