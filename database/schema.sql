-- ====================================================================
-- DEVFORGE PostgreSQL Schema: CRM B2B Comercial y Gestión de Clientes
-- ====================================================================

-- 1. Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabla Principal: Clientes / Empresas B2B
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    nombre_comercial VARCHAR(150),
    identificacion_fiscal VARCHAR(50),
    sector VARCHAR(80) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'prospecto', -- 'prospecto', 'en_negociacion', 'activo', 'inactivo', 'cerrado_perdido'
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media',  -- 'alta', 'media', 'baja'
    sitio_web VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(80),
    pais VARCHAR(80) DEFAULT 'República Dominicana',
    valor_estimado NUMERIC(15, 2) DEFAULT 0,
    responsable VARCHAR(100) NOT NULL,
    ultimo_contacto TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda y filtrado de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_sector ON clientes(sector);
CREATE INDEX IF NOT EXISTS idx_clientes_responsable ON clientes(responsable);
CREATE INDEX IF NOT EXISTS idx_clientes_creado_en ON clientes(creado_en DESC);

-- 3. Tabla: Contactos Clave
CREATE TABLE IF NOT EXISTS contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(50),
    es_principal BOOLEAN DEFAULT false,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contactos_cliente ON contactos(cliente_id);

-- 4. Tabla: Oportunidades Comerciales
CREATE TABLE IF NOT EXISTS oportunidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    monto NUMERIC(15, 2) NOT NULL DEFAULT 0,
    etapa VARCHAR(50) NOT NULL DEFAULT 'calificacion', -- 'calificacion', 'propuesta', 'negociacion', 'ganada', 'perdida'
    probabilidad INT DEFAULT 30,
    fecha_cierre_estimada DATE,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente ON oportunidades(cliente_id);

-- 5. Tabla: Historial de Actividades y Notas
CREATE TABLE IF NOT EXISTS actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL, -- 'llamada', 'reunion', 'correo', 'nota'
    descripcion TEXT NOT NULL,
    realizado_por VARCHAR(100) NOT NULL,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_actividades_cliente ON actividades(cliente_id);

-- 6. Tablas de Seguridad y Control de Acceso (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(30) PRIMARY KEY, -- 'admin', 'gerente', 'ejecutivo', 'auditor'
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id VARCHAR(30) NOT NULL REFERENCES roles(id),
    cargo VARCHAR(100),
    telefono VARCHAR(50),
    avatar VARCHAR(10),
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permisos_rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id VARCHAR(30) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    accion VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
    sujeto VARCHAR(50) NOT NULL, -- 'Cliente', 'Oportunidad', 'Actividad', 'Metricas', 'all'
    condiciones JSONB DEFAULT NULL
);

-- 7. Procedimiento / Función de Consulta Paginada de Clientes (Data-Grid)
CREATE OR REPLACE FUNCTION sp_obtener_clientes_paginados(
    p_busqueda VARCHAR DEFAULT '',
    p_estado VARCHAR DEFAULT '',
    p_sector VARCHAR DEFAULT '',
    p_orden_campo VARCHAR DEFAULT 'creado_en',
    p_orden_direccion VARCHAR DEFAULT 'desc',
    p_pagina INT DEFAULT 1,
    p_tamano_pagina INT DEFAULT 15
)
RETURNS TABLE (
    id UUID,
    codigo VARCHAR,
    razon_social VARCHAR,
    nombre_comercial VARCHAR,
    identificacion_fiscal VARCHAR,
    sector VARCHAR,
    estado VARCHAR,
    prioridad VARCHAR,
    telefono VARCHAR,
    email VARCHAR,
    ciudad VARCHAR,
    pais VARCHAR,
    valor_estimado NUMERIC,
    responsable VARCHAR,
    ultimo_contacto TIMESTAMPTZ,
    creado_en TIMESTAMPTZ,
    total_registros BIGINT
) AS $$
DECLARE
    v_offset INT := (p_pagina - 1) * p_tamano_pagina;
BEGIN
    RETURN QUERY
    WITH filtrados AS (
        SELECT c.*
        FROM clientes c
        WHERE (p_busqueda = '' OR 
               c.razon_social ILIKE '%' || p_busqueda || '%' OR
               c.codigo ILIKE '%' || p_busqueda || '%' OR
               c.identificacion_fiscal ILIKE '%' || p_busqueda || '%' OR
               c.responsable ILIKE '%' || p_busqueda || '%')
          AND (p_estado = '' OR c.estado = p_estado)
          AND (p_sector = '' OR c.sector = p_sector)
    ),
    conteo AS (
        SELECT COUNT(*) AS total FROM filtrados
    )
    SELECT 
        f.id,
        f.codigo,
        f.razon_social,
        f.nombre_comercial,
        f.identificacion_fiscal,
        f.sector,
        f.estado,
        f.prioridad,
        f.telefono,
        f.email,
        f.ciudad,
        f.pais,
        f.valor_estimado,
        f.responsable,
        f.ultimo_contacto,
        f.creado_en,
        c.total
    FROM filtrados f
    CROSS JOIN conteo c
    ORDER BY 
        CASE WHEN p_orden_campo = 'razon_social' AND p_orden_direccion = 'asc' THEN f.razon_social END ASC,
        CASE WHEN p_orden_campo = 'razon_social' AND p_orden_direccion = 'desc' THEN f.razon_social END DESC,
        CASE WHEN p_orden_campo = 'valor_estimado' AND p_orden_direccion = 'asc' THEN f.valor_estimado END ASC,
        CASE WHEN p_orden_campo = 'valor_estimado' AND p_orden_direccion = 'desc' THEN f.valor_estimado END DESC,
        CASE WHEN p_orden_campo = 'creado_en' AND p_orden_direccion = 'asc' THEN f.creado_en END ASC,
        CASE WHEN p_orden_campo = 'creado_en' AND p_orden_direccion = 'desc' THEN f.creado_en END DESC
    LIMIT p_tamano_pagina OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;
