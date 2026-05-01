const prisma  = require('../lib/prisma');
const mailer  = require('../lib/mailer');

// ─── Catálogo de productos ────────────────────────────────────────────────────
exports.index = async (req, res) => {
    const { categoria } = req.query;
    try {
        const where = {};
        if (categoria && categoria !== 'TODOS') where.categoria = categoria;

        const [productos, totalProductos] = await Promise.all([
            prisma.producto.findMany({ where, orderBy: { nombre: 'asc' } }),
            prisma.producto.count(),
        ]);

        res.render('tienda/index', {
            title: 'Tienda | CB Granollers',
            productos,
            totalProductos,
            categoriaFiltro: categoria || null,
            categorias: ['ROPA', 'EQUIPAMIENTO', 'MERCHANDISING'],
        });
    } catch (error) {
        console.error('Error al cargar tienda:', error);
        req.flash('error', 'Error al cargar la tienda.');
        res.redirect('/');
    }
};

// ─── Detalle de producto ──────────────────────────────────────────────────────
exports.show = async (req, res) => {
    const { id } = req.params;
    try {
        const producto = await prisma.producto.findUnique({ where: { id: parseInt(id) } });
        if (!producto) {
            req.flash('error', 'Producto no encontrado.');
            return res.redirect('/tienda');
        }
        const relacionados = await prisma.producto.findMany({
            where: { categoria: producto.categoria, id: { not: producto.id } },
            take: 4,
        });
        res.render('tienda/producto', {
            title: `${producto.nombre} | Tienda CB Granollers`,
            producto,
            relacionados,
        });
    } catch (error) {
        console.error('Error al cargar producto:', error);
        req.flash('error', 'Error al cargar el producto.');
        res.redirect('/tienda');
    }
};

// ─── Ver carrito ──────────────────────────────────────────────────────────────
exports.verCarrito = async (req, res) => {
    try {
        const carrito = req.session.carrito || [];
        let items = [];
        let total = 0;

        if (carrito.length > 0) {
            const ids = carrito.map(item => item.productoId);
            const productos = await prisma.producto.findMany({ where: { id: { in: ids } } });

            items = carrito.map(item => {
                const producto = productos.find(p => p.id === item.productoId);
                const subtotal = producto ? Number(producto.precio) * item.cantidad : 0;
                total += subtotal;
                return { ...item, producto, subtotal };
            }).filter(item => item.producto); // eliminar items sin producto
        }

        res.render('tienda/carrito', {
            title: 'Carrito | CB Granollers',
            items,
            total: total.toFixed(2),
        });
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        req.flash('error', 'Error al cargar el carrito.');
        res.redirect('/tienda');
    }
};

// ─── Añadir al carrito ────────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
    const { productoId, cantidad } = req.body;
    const qty = parseInt(cantidad) || 1;
    try {
        const producto = await prisma.producto.findUnique({ where: { id: parseInt(productoId) } });
        if (!producto || producto.stock < qty) {
            req.flash('error', 'Producto no disponible o sin stock suficiente.');
            return res.redirect('/tienda');
        }
        if (!req.session.carrito) req.session.carrito = [];
        const existingIndex = req.session.carrito.findIndex(
            item => item.productoId === parseInt(productoId)
        );
        if (existingIndex >= 0) {
            req.session.carrito[existingIndex].cantidad += qty;
        } else {
            req.session.carrito.push({ productoId: parseInt(productoId), cantidad: qty });
        }
        req.flash('exito', `"${producto.nombre}" añadido al carrito.`);
        res.redirect('/tienda/carrito');
    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        req.flash('error', 'Error al añadir el producto.');
        res.redirect('/tienda');
    }
};

// ─── Actualizar cantidad ──────────────────────────────────────────────────────
exports.updateCart = (req, res) => {
    const { productoId, cantidad } = req.body;
    const qty = parseInt(cantidad);
    if (!req.session.carrito) return res.redirect('/tienda/carrito');
    if (qty <= 0) {
        req.session.carrito = req.session.carrito.filter(
            item => item.productoId !== parseInt(productoId)
        );
    } else {
        const index = req.session.carrito.findIndex(
            item => item.productoId === parseInt(productoId)
        );
        if (index >= 0) req.session.carrito[index].cantidad = qty;
    }
    res.redirect('/tienda/carrito');
};

// ─── Eliminar del carrito ─────────────────────────────────────────────────────
exports.removeFromCart = (req, res) => {
    const productoId = parseInt(req.body.productoId);
    if (req.session.carrito) {
        req.session.carrito = req.session.carrito.filter(
            item => item.productoId !== productoId
        );
    }
    req.flash('exito', 'Producto eliminado del carrito.');
    res.redirect('/tienda/carrito');
};

// ─── Checkout: resumen del pedido ─────────────────────────────────────────────
exports.showCheckout = async (req, res) => {
    const carrito = req.session.carrito || [];
    if (carrito.length === 0) {
        req.flash('error', 'Tu carrito está vacío.');
        return res.redirect('/tienda');
    }
    try {
        const ids = carrito.map(item => item.productoId);
        const productos = await prisma.producto.findMany({ where: { id: { in: ids } } });

        let total = 0;
        const items = carrito.map(item => {
            const producto = productos.find(p => p.id === item.productoId);
            const subtotal = producto ? Number(producto.precio) * item.cantidad : 0;
            total += subtotal;
            return { ...item, producto, subtotal };
        }).filter(item => item.producto);

        res.render('tienda/checkout', {
            title: 'Confirmar pedido | CB Granollers',
            items,
            total: total.toFixed(2),
        });
    } catch (error) {
        console.error('Error en checkout:', error);
        req.flash('error', 'Error al cargar el checkout.');
        res.redirect('/tienda/carrito');
    }
};

// ─── Mock pago: pantalla de datos de tarjeta ──────────────────────────────────
exports.showMockPayment = async (req, res) => {
    const carrito = req.session.carrito || [];
    if (carrito.length === 0) {
        req.flash('error', 'Tu carrito está vacío.');
        return res.redirect('/tienda');
    }
    try {
        const ids = carrito.map(item => item.productoId);
        const productos = await prisma.producto.findMany({ where: { id: { in: ids } } });

        let total = 0;
        const items = carrito.map(item => {
            const producto = productos.find(p => p.id === item.productoId);
            const subtotal = producto ? Number(producto.precio) * item.cantidad : 0;
            total += subtotal;
            return { ...item, producto, subtotal };
        }).filter(item => item.producto);

        const { direccion } = req.body;

        res.render('tienda/pago', {
            title: 'Pago seguro | CB Granollers',
            items,
            total: total.toFixed(2),
            direccion: direccion || '',
        });
    } catch (error) {
        console.error('Error en mock pago:', error);
        req.flash('error', 'Error al cargar el pago.');
        res.redirect('/tienda/checkout');
    }
};

// ─── Procesar pago y guardar pedido ──────────────────────────────────────────
exports.procesarPago = async (req, res) => {
    const carrito = req.session.carrito || [];
    const personaId = req.session.usuario.id;

    if (carrito.length === 0) {
        req.flash('error', 'Tu carrito está vacío.');
        return res.redirect('/tienda');
    }

    try {
        const ids = carrito.map(item => item.productoId);
        const productos = await prisma.producto.findMany({ where: { id: { in: ids } } });

        let total = 0;
        const items = carrito.map(item => {
            const producto = productos.find(p => p.id === item.productoId);
            const precio = producto ? Number(producto.precio) : 0;
            total += precio * item.cantidad;
            return { productoId: item.productoId, cantidad: item.cantidad, precioUnit: precio };
        });

        // Crear compra + líneas en transacción atómica
        const compra = await prisma.$transaction(async (tx) => {
            // ── Validar stock disponible antes de proceder ────────────────────
            for (const item of items) {
                const productoActual = await tx.producto.findUnique({
                    where: { id: item.productoId },
                    select: { id: true, nombre: true, stock: true },
                });
                if (!productoActual) {
                    throw new Error(`Producto ${item.productoId} no encontrado.`);
                }
                if (productoActual.stock < item.cantidad) {
                    throw new Error(
                        `Stock insuficiente para "${productoActual.nombre}": ` +
                        `disponible ${productoActual.stock}, solicitado ${item.cantidad}.`
                    );
                }
            }

            const nuevaCompra = await tx.compra.create({
                data: {
                    personaId,
                    total,
                    estado: 'PAGADA',
                    CompraProducto: {
                        create: items.map(item => ({
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precioUnit: item.precioUnit,
                        })),
                    },
                },
                include: { CompraProducto: { include: { producto: true } } },
            });

            // Descontar stock (garantizado: la validación anterior evita negativos)
            for (const item of items) {
                await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: { decrement: item.cantidad } },
                });
            }
            return nuevaCompra;
        });

        // Limpiar carrito de sesión
        req.session.carrito = [];

        // Notificar al admin por email (sin bloquear la respuesta)
        const persona = await prisma.persona.findUnique({
            where: { id: personaId },
            select: { nombre: true, apellidos: true, email: true, telefono: true },
        });
        if (persona) mailer.notificarCompra(compra, persona);

        req.flash('exito', `¡Pedido #${compra.id.substring(0, 8).toUpperCase()} realizado con éxito!`);
        res.redirect(`/tienda/compra/${compra.id}`);

    } catch (error) {
        console.error('Error al procesar pago:', error);
        // Si el error es de stock insuficiente, mostramos el mensaje específico al usuario
        const msg = error.message?.startsWith('Stock insuficiente') || error.message?.startsWith('Producto')
            ? error.message
            : 'Error al procesar el pago. Inténtalo de nuevo.';
        req.flash('error', msg);
        res.redirect('/tienda/checkout');
    }
};

// ─── Confirmación de compra ───────────────────────────────────────────────────
exports.showCompra = async (req, res) => {
    const { id } = req.params;
    try {
        const compra = await prisma.compra.findUnique({
            where: { id, personaId: req.session.usuario.id },
            include: {
                CompraProducto: { include: { producto: true } },
                persona: { select: { nombre: true, apellidos: true, email: true } },
            },
        });
        if (!compra) {
            req.flash('error', 'Pedido no encontrado.');
            return res.redirect('/auth/perfil');
        }
        res.render('tienda/confirmacion', {
            title: `Pedido confirmado | CB Granollers`,
            compra,
        });
    } catch (error) {
        console.error('Error al cargar compra:', error);
        req.flash('error', 'Error al cargar el pedido.');
        res.redirect('/auth/perfil');
    }
};
