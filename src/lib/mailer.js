const nodemailer = require('nodemailer');

// ─── Transporter (Gmail con contraseña de aplicación) ─────────────────────────
const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,   // Contraseña de aplicación de Google
    },
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'danielgalantavares@gmail.com';
const FROM        = `"CB Granollers" <${process.env.EMAIL_USER}>`;

// ─── Helper: enviar sin bloquear (errores siempre en consola) ────────────────
async function send(options) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[Mailer] ⚠️  EMAIL_USER / EMAIL_PASS no configurados — email no enviado.');
        return;
    }
    console.log(`[Mailer] Enviando email a ${options.to} · asunto: ${options.subject}`);
    try {
        const info = await transporter.sendMail(options);
        console.log('[Mailer] ✅ Email enviado. messageId:', info.messageId);
    } catch (err) {
        console.error('[Mailer] ❌ Error al enviar email:', err.message);
        console.error('[Mailer] Detalle:', err.code, err.response || '');
    }
}

// ─── Email: nuevo registro ────────────────────────────────────────────────────
exports.notificarRegistro = async (persona) => {
    const esMenor = persona.tutorNombre ? true : false;
    const fechaNac = persona.fechaNacimiento
        ? new Date(persona.fechaNacimiento).toLocaleDateString('es')
        : '–';

    const tutorHtml = esMenor ? `
        <tr><td colspan="2" style="padding:12px 0 4px;font-weight:700;color:#c0392b">
            👪 Datos del tutor legal
        </td></tr>
        <tr><td style="color:#666;padding:4px 12px 4px 0">Nombre tutor</td>
            <td><strong>${persona.tutorNombre} ${persona.tutorApellidos}</strong></td></tr>
        <tr><td style="color:#666;padding:4px 12px 4px 0">DNI tutor</td>
            <td>${persona.tutorDni}</td></tr>
        <tr><td style="color:#666;padding:4px 12px 4px 0">Teléfono tutor</td>
            <td>${persona.tutorTelefono || '–'}</td></tr>
        <tr><td style="color:#666;padding:4px 12px 4px 0">Fecha nac. tutor</td>
            <td>${persona.tutorFechaNacimiento
                ? new Date(persona.tutorFechaNacimiento).toLocaleDateString('es')
                : '–'}</td></tr>
    ` : '';

    await send({
        from:    FROM,
        to:      ADMIN_EMAIL,
        subject: `⚾ Nuevo socio registrado — ${persona.nombre} ${persona.apellidos}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
          <div style="background:#c0392b;padding:20px 24px">
            <h2 style="color:#fff;margin:0;font-size:1.1rem">⚾ CB Granollers — Nuevo registro</h2>
          </div>
          <div style="padding:24px">
            <p style="margin:0 0 16px;color:#333">Se ha registrado un nuevo socio en la plataforma:</p>
            <table style="width:100%;border-collapse:collapse;font-size:.9rem">
              <tr><td style="color:#666;padding:4px 12px 4px 0;width:160px">Nombre</td>
                  <td><strong>${persona.nombre} ${persona.apellidos}</strong></td></tr>
              <tr><td style="color:#666;padding:4px 12px 4px 0">Email</td>
                  <td>${persona.email}</td></tr>
              <tr><td style="color:#666;padding:4px 12px 4px 0">Teléfono</td>
                  <td>${persona.telefono || '–'}</td></tr>
              <tr><td style="color:#666;padding:4px 12px 4px 0">Fecha nacimiento</td>
                  <td>${fechaNac} ${esMenor ? '<span style="color:#c0392b;font-weight:700">(MENOR DE EDAD)</span>' : ''}</td></tr>
              <tr><td style="color:#666;padding:4px 12px 4px 0">Rol asignado</td>
                  <td>SOCIO</td></tr>
              <tr><td style="color:#666;padding:4px 12px 4px 0">Fecha registro</td>
                  <td>${new Date().toLocaleString('es')}</td></tr>
              ${tutorHtml}
            </table>
          </div>
          <div style="background:#f5f5f5;padding:12px 24px;font-size:.8rem;color:#999">
            Mensaje automático generado por CB Granollers — no responder a este correo.
          </div>
        </div>`,
    });
};

// ─── Email: nueva compra ──────────────────────────────────────────────────────
exports.notificarCompra = async (compra, persona) => {
    const lineas = compra.CompraProducto || [];
    const filasProductos = lineas.map(l => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#333">${l.producto ? l.producto.nombre : '–'}</td>
          <td style="padding:6px 12px 6px 0;text-align:center;color:#666">${l.cantidad}</td>
          <td style="padding:6px 0;text-align:right;color:#333">${Number(l.precioUnit).toFixed(2)} €</td>
        </tr>
    `).join('');

    await send({
        from:    FROM,
        to:      ADMIN_EMAIL,
        subject: `🛍️ Nuevo pedido #${compra.id.substring(0, 8).toUpperCase()} — ${persona.nombre} ${persona.apellidos}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
          <div style="background:#c0392b;padding:20px 24px">
            <h2 style="color:#fff;margin:0;font-size:1.1rem">🛍️ CB Granollers — Nuevo pedido</h2>
          </div>
          <div style="padding:24px">

            <h3 style="margin:0 0 8px;font-size:.95rem;color:#555;text-transform:uppercase;letter-spacing:.05em">Comprador</h3>
            <table style="width:100%;border-collapse:collapse;font-size:.9rem;margin-bottom:20px">
              <tr><td style="color:#666;padding:4px 12px 4px 0;width:140px">Nombre</td>
                  <td><strong>${persona.nombre} ${persona.apellidos}</strong></td></tr>
              <tr><td style="color:#666;padding:4px 12px 4px 0">Email</td>
                  <td>${persona.email}</td></tr>
              <tr><td style="color:#666;padding:4px 12px 4px 0">Teléfono</td>
                  <td>${persona.telefono || '–'}</td></tr>
            </table>

            <h3 style="margin:0 0 8px;font-size:.95rem;color:#555;text-transform:uppercase;letter-spacing:.05em">Pedido #${compra.id.substring(0, 8).toUpperCase()}</h3>
            <table style="width:100%;border-collapse:collapse;font-size:.9rem">
              <thead>
                <tr style="border-bottom:2px solid #eee">
                  <th style="text-align:left;padding:4px 12px 8px 0;color:#555">Producto</th>
                  <th style="text-align:center;padding:4px 12px 8px;color:#555">Cant.</th>
                  <th style="text-align:right;padding:4px 0 8px;color:#555">Precio u.</th>
                </tr>
              </thead>
              <tbody>
                ${filasProductos}
              </tbody>
              <tfoot>
                <tr style="border-top:2px solid #eee">
                  <td colspan="2" style="padding:10px 0 0;font-weight:700;color:#333">TOTAL</td>
                  <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:1.05rem;color:#c0392b">${Number(compra.total).toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>

            <p style="margin:16px 0 0;font-size:.85rem;color:#888">Fecha: ${new Date().toLocaleString('es')} · Estado: PAGADA</p>
          </div>
          <div style="background:#f5f5f5;padding:12px 24px;font-size:.8rem;color:#999">
            Mensaje automático generado por CB Granollers — no responder a este correo.
          </div>
        </div>`,
    });
};
