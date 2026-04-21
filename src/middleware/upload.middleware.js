const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');

// ── Filtro: solo imágenes ─────────────────────────────────────────────────────
function imageFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|webp|avif/;
    const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.replace('image/', ''));
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp).'));
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ── Cloudinary (producción) vs disco (desarrollo) ─────────────────────────────
const USE_CLOUD = !!(process.env.CLOUDINARY_CLOUD_NAME &&
                     process.env.CLOUDINARY_API_KEY   &&
                     process.env.CLOUDINARY_API_SECRET);

let uploadNoticias, uploadProductos;

if (USE_CLOUD) {
    const cloudinary   = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const storageNoticias = new CloudinaryStorage({
        cloudinary,
        params: { folder: 'cbgranollers/noticias', allowed_formats: ['jpg','png','webp','gif','avif'] },
    });

    const storageProductos = new CloudinaryStorage({
        cloudinary,
        params: { folder: 'cbgranollers/productos', allowed_formats: ['jpg','png','webp','gif','avif'] },
    });

    uploadNoticias  = multer({ storage: storageNoticias,  fileFilter: imageFilter, limits: { fileSize: MAX_SIZE } }).single('imagen');
    uploadProductos = multer({ storage: storageProductos, fileFilter: imageFilter, limits: { fileSize: MAX_SIZE } }).single('imagen');

} else {
    // Disco local (desarrollo sin Cloudinary)
    function uniqueName(file) {
        const ext  = path.extname(file.originalname).toLowerCase();
        const hash = crypto.randomBytes(8).toString('hex');
        return `${Date.now()}-${hash}${ext}`;
    }

    const storageNoticias = multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/images/noticias')),
        filename:    (req, file, cb) => cb(null, uniqueName(file)),
    });

    const storageProductos = multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/images/productos')),
        filename:    (req, file, cb) => cb(null, uniqueName(file)),
    });

    uploadNoticias  = multer({ storage: storageNoticias,  fileFilter: imageFilter, limits: { fileSize: MAX_SIZE } }).single('imagen');
    uploadProductos = multer({ storage: storageProductos, fileFilter: imageFilter, limits: { fileSize: MAX_SIZE } }).single('imagen');
}

exports.uploadNoticia  = uploadNoticias;
exports.uploadProducto = uploadProductos;

// ── Wrapper que convierte errores de multer en flash message ──────────────────
exports.handleUploadError = (uploadFn) => (req, res, next) => {
    uploadFn(req, res, (err) => {
        if (err) {
            req.flash('error', err.message || 'Error al subir la imagen.');
            return res.redirect('back');
        }
        next();
    });
};
