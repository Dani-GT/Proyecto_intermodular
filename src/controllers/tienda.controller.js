const prisma = require('../lib/prisma');

// ─── Catálogo de productos ────────────────────────────────────────────────────
exports.index = async (req, res) => {
    const { categoria } = req.query;
    try {
        const where = { activo: true };
        if (categoria) where.categoria = categoria;

        const [productos, totalProductos] = await Promise.all([
            prisma.producto.findMany({
                where,
                orderBy: { nombre: 'asc' }
            }),
            prisma.producto.count({ where: { activo: true } })
        ]);

        res.render('tienda/index', {
            title: 'Tienda | CB Granollers',
            productos,
            totalProductos,
            categoriaFiltro: categoria || null,
            categorias: ['UNIFORME', 'EQUIPAMIENTO', 'ACCESORIO', 'OTRO'],
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
        const producto = await prisma.producto.findUnique({
            where: { id: parseInt(id), activo: true }
        });

        if (!producto) {
            req.flash('error', 'Producto no encontrado.');
            return res.redirect('/tienda');
        }

        // Productos relacionados
        const relacionados = await prisma.producto.findMany({
            where: { categoria: producto.categoria, activo: true, id: { not: producto.id } },
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

// ─── Ver carrito (desde sesión) ───────────────────────────────────────────────
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
                const subtotal = producto ? parseFloat(producto.precio) * item.cantidad : 0;
                total += subtotal;
                return { ...item, producto, subtotal };
            });
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
        const producto = await prisma.producto.findUnique({
            where: { id: parseInt(productoId), activo: true }
        });

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

        req.flash('exito', `${producto.nombre} añadido al carrito.`);
        res.redirect('/tienda/carrito');
    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        req.flash('error', 'Error al añadir el producto.');
        res.redirect('/tienda');
    }
};

// ─── Actualizar cantidad en carrito ──────────────────────────────────────────
exports.updateCart = (req, res) => {
    const { productoId, cantidad } = req.body;
    const qty = parseInt(cantidad);

    if (!req.session.carrito) {
        return res.redirect('/tienda/carrito');
    }

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

// ─── Eliminar del carrito ──────────────────────────────────────────────────────
exports.removeFromCart = (req, res) => {
    const { productoId } = req.params;
    if (req.session.carrito) {
        req.session.carrito = req.session.carrito.filter(
            item => item.productoId !== parseInt(productoId)
        );
    }
    req.flash('exito', 'Producto eliminado del carrito.');
    res.redirect('/tienda/carrito');
};

// ─── Checkout ─────────────────────────────────────────────────────────────────
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
            const subtotal = producto ? parseFloat(producto.precio) * item.cantidad : 0;
            total += subtotal;
            return { ...item, producto, subtotal };
        });

        res.render('tienda/checkout', {
            title: 'Checkout | CB Granollers',
            items,
            total: total.toFixed(2),
        });
    } catch (error) {
        console.error('Error en checkout:', error);
        req.flash('error', 'Error al cargar el checkout.');
        res.redirect('/tienda/carrito');
    }
};

// ─── Confirmar compra ──────────────────────────────────────────────────────────
exports.confirmarCompra = async (req, res) => {
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
            const precio = producto ? parseFloat(producto.precio) : 0;
            total += precio * item.cantidad;
            return { productoId: item.productoId, cantidad: item.cantidad, precioUnit: precio };
        });

        // Crear la compra en una transacción
        const compra = await prisma.$transaction(async (tx) => {
            const nuevaCompra = await tx.compra.create({
                data: {
                    personaId,
                    total,
                    estado: 'PAGADA',
                    items: {
                        create: items.map(item => ({
                            productoId: item.productoId,
                            cantidad: item.cantidad,
                            precioUnit: item.precioUnit,
                        }))
                    }
                },
                include: { items: { include: { producto: true } } }
            });

            // Descontar stock
            for (const item of items) {
                await tx.producto.update({
                    where: { id: item.productoId },
                    data: { stock: { decrement: item.cantidad } }
                });
            }

            return nuevaCompra;
        });

        // Limpiar carrito
        req.session.carrito = [];

        req.flash('exito', `¡Compra realizada con éxito! Número de pedido: #${compra.id}`);
        res.redirect(`/tienda/compra/${compra.id}`);

    } catch (error) {
        console.error('Error al confirmar compra:', error);
        req.flash('error', 'Error al procesar la compra. Inténtalo de nuevo.');
        res.redirect('/tienda/carrito');
    }
};

// ─── Confirmación de compra ────────────────────────────────────────────────────
exports.showCompra = async (req, res) => {
    const { id } = req.params;
    try {
        const compra = await prisma.compra.findUnique({
            where: { id: parseInt(id), personaId: req.session.usuario.id },
            include: {
                items: { include: { producto: true } },
                persona: { select: { nombre: true, apellidos: true, email: true } }
            }
        });

        if (!compra) {
            req.flash('error', 'Compra no encontrada.');
            return res.redirect('/auth/perfil');
        }

        res.render('tienda/confirmacion', {
            title: `Pedido #${compra.id} | CB Granollers`,
            compra,
        });
    } catch (error) {
        console.error('Error al cargar compra:', error);
        req.flash('error', 'Error al cargar el pedido.');
        res.redirect('/auth/perfil');
    }
};
