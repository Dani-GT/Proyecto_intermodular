const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Genera un nombre único para evitar colisiones
function uniqueName(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(8).toString('hex');
    return `${Date.now()}-${hash}${ext}`;
}

// Filtro: solo imágenes
function imageFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|webp|avif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.replace('image/', ''));
    if (extOk && mimeOk) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp).'));
    }
}

// Storage para noticias
const storageNoticias = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images/noticias'));
    },
    filename: (req, file, cb) => {
        cb(null, uniqueName(file));
    },
});

// Storage para productos
const storageProductos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images/productos'));
    },
    filename: (req, file, cb) => {
        cb(null, uniqueName(file));
    },
});

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

exports.uploadNoticia = multer({
    storage: storageNoticias,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_SIZE },
}).single('imagen');

exports.uploadProducto = multer({
    storage: storageProductos,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_SIZE },
}).single('imagen');

// Wrapper que convierte el error de multer en flash message
exports.handleUploadError = (uploadFn) => (req, res, next) => {
    uploadFn(req, res, (err) => {
        if (err) {
            req.flash('error', err.message || 'Error al subir la imagen.');
            return res.redirect('back');
        }
        next();
    });
};
