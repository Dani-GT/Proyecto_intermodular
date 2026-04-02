/**
 * Store de sesiones personalizado usando PostgreSQL (pg).
 * No requiere paquetes extra — usa el `pg` ya instalado.
 * Las sesiones se persisten en Supabase, sobreviviendo reinicios de Render.
 */
const { Pool } = require('pg');
const { Store } = require('express-session');

class PgSessionStore extends Store {
    constructor(options = {}) {
        super(options);
        this.tableName = options.tableName || 'user_sessions';
        this.ttl = options.ttl || 60 * 60 * 24 * 7; // 7 días en segundos

        this.pool = new Pool({
            connectionString: options.connectionString,
            ssl: { rejectUnauthorized: false },
            max: 2,
            idleTimeoutMillis: 30000,
        });

        this.pool.on('error', (err) => {
            console.error('[SessionStore] Error en pool de pg:', err.message);
        });

        this._createTable();
    }

    // Crea la tabla si no existe (se ejecuta al arrancar)
    async _createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS "${this.tableName}" (
                sid  VARCHAR(255) NOT NULL PRIMARY KEY,
                sess JSON         NOT NULL,
                expire TIMESTAMPTZ NOT NULL
            );
            CREATE INDEX IF NOT EXISTS "idx_${this.tableName}_expire"
                ON "${this.tableName}" (expire);
        `;
        try {
            await this.pool.query(sql);
        } catch (err) {
            console.error('[SessionStore] No se pudo crear la tabla de sesiones:', err.message);
        }
    }

    // Calcular fecha de expiración
    _expire(session) {
        if (session && session.cookie && session.cookie.expires) {
            return new Date(session.cookie.expires);
        }
        return new Date(Date.now() + this.ttl * 1000);
    }

    // GET — leer sesión por ID
    get(sid, callback) {
        this.pool.query(
            `SELECT sess FROM "${this.tableName}" WHERE sid = $1 AND expire > NOW()`,
            [sid]
        )
        .then(({ rows }) => {
            if (!rows.length) return callback(null, null);
            callback(null, rows[0].sess);
        })
        .catch((err) => {
            console.error('[SessionStore] get error:', err.message);
            callback(err);
        });
    }

    // SET — guardar o actualizar sesión
    set(sid, session, callback) {
        const expire = this._expire(session);
        this.pool.query(
            `INSERT INTO "${this.tableName}" (sid, sess, expire)
             VALUES ($1, $2, $3)
             ON CONFLICT (sid) DO UPDATE
             SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
            [sid, JSON.stringify(session), expire]
        )
        .then(() => callback(null))
        .catch((err) => {
            console.error('[SessionStore] set error:', err.message);
            callback(err);
        });
    }

    // DESTROY — eliminar sesión (logout)
    destroy(sid, callback) {
        this.pool.query(
            `DELETE FROM "${this.tableName}" WHERE sid = $1`,
            [sid]
        )
        .then(() => callback(null))
        .catch((err) => {
            console.error('[SessionStore] destroy error:', err.message);
            callback(err);
        });
    }

    // TOUCH — renovar expiración sin modificar datos
    touch(sid, session, callback) {
        const expire = this._expire(session);
        this.pool.query(
            `UPDATE "${this.tableName}" SET expire = $2 WHERE sid = $1`,
            [sid, expire]
        )
        .then(() => callback(null))
        .catch((err) => {
            // No crítico — no romper la petición si falla el touch
            callback(null);
        });
    }

    // Limpiar sesiones caducadas (opcional, llamar periódicamente)
    cleanup(callback) {
        this.pool.query(`DELETE FROM "${this.tableName}" WHERE expire < NOW()`)
        .then(() => callback && callback(null))
        .catch((err) => callback && callback(err));
    }
}

module.exports = PgSessionStore;
