-- Migración manual: añade rolSolicitado a inscripciones y crea tutores_legales
-- Ejecutar desde tu terminal: npx prisma db push
-- O si prefieres SQL directo en Supabase SQL Editor:

ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS "rolSolicitado" "TipoRol" NOT NULL DEFAULT 'JUGADOR';

CREATE TABLE IF NOT EXISTS tutores_legales (
  id SERIAL PRIMARY KEY,
  "inscripcionId" INTEGER NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  dni VARCHAR(20) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tutores_legales_inscripcionId_fkey"
    FOREIGN KEY ("inscripcionId") REFERENCES inscripciones(id) ON DELETE CASCADE
);
