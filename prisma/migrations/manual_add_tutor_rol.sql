-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRACIÓN MANUAL — Ejecutar en Supabase SQL Editor
-- Añade: rolSolicitado en inscripciones + crea/actualiza tutores_legales
-- Es seguro ejecutar varias veces (IF NOT EXISTS en todo)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Columna rolSolicitado en inscripciones
ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS "rolSolicitado" "TipoRol" NOT NULL DEFAULT 'JUGADOR';

-- 2. Tabla tutores_legales con todos los campos
CREATE TABLE IF NOT EXISTS tutores_legales (
  id                SERIAL        PRIMARY KEY,
  "inscripcionId"   INTEGER       NOT NULL UNIQUE,
  nombre            VARCHAR(100)  NOT NULL,
  apellidos         VARCHAR(100)  NOT NULL,
  dni               VARCHAR(20)   NOT NULL,
  telefono          VARCHAR(20)   NOT NULL DEFAULT '',
  "fechaNacimiento" TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tutores_legales_inscripcionId_fkey"
    FOREIGN KEY ("inscripcionId") REFERENCES inscripciones(id) ON DELETE CASCADE
);

-- 3. Si la tabla ya existía sin las columnas nuevas, añadirlas
ALTER TABLE tutores_legales
  ADD COLUMN IF NOT EXISTS telefono          VARCHAR(20)  NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "fechaNacimiento" TIMESTAMP(3);

-- 4. Columnas de tutor en personas (para menores en el registro)
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS "tutorNombre"          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "tutorApellidos"        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "tutorDni"              VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "tutorTelefono"         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "tutorFechaNacimiento"  TIMESTAMP(3);
