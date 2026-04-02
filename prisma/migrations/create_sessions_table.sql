-- Tabla para persistir sesiones de usuario en producción (Render + Supabase)
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS "user_sessions" (
    sid     VARCHAR(255)  NOT NULL PRIMARY KEY,
    sess    JSON          NOT NULL,
    expire  TIMESTAMPTZ   NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_user_sessions_expire"
    ON "user_sessions" (expire);
