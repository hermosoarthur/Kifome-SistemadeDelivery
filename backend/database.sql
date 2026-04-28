-- Kifome v3 — Execute no Supabase SQL Editor

DROP TABLE IF EXISTS itens_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS entregadores CASCADE;
DROP TABLE IF EXISTS restaurantes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(15),
    tipo VARCHAR(20) NOT NULL DEFAULT 'cliente',
    supabase_uid VARCHAR(255) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    endereco_principal VARCHAR(500),
    endereco_json JSONB,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    tem_endereco BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE restaurantes (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(100) NOT NULL,
    descricao VARCHAR(500),
    endereco VARCHAR(200) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    endereco_json JSONB,
    telefone VARCHAR(20),
    categoria VARCHAR(100),
    imagem_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(100),
    preco DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    imagem_url VARCHAR(500),
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE entregadores (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    veiculo VARCHAR(20) NOT NULL DEFAULT 'moto',
    placa VARCHAR(20),
    cnh VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    entregador_id INTEGER REFERENCES entregadores(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'aguardando',
    endereco_entrega VARCHAR(500) NOT NULL,
    endereco_detalhes JSONB,
    endereco_latitude DOUBLE PRECISION,
    endereco_longitude DOUBLE PRECISION,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    observacao TEXT,
    avaliacao_nota INTEGER,
    avaliacao_comentario TEXT,
    avaliacao_em TIMESTAMP,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10,2) NOT NULL
);

-- Indexes
CREATE INDEX ON usuarios(email);
CREATE INDEX ON restaurantes(usuario_id);
CREATE INDEX ON restaurantes(status);
CREATE INDEX ON produtos(restaurante_id);
CREATE INDEX ON pedidos(cliente_id);
CREATE INDEX ON pedidos(restaurante_id);

-- ============================================================================
-- MIGRATION: Add geo columns to restaurantes (run if table already exists)
-- ============================================================================
-- ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
-- ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
-- ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS endereco_json JSONB;
CREATE INDEX ON pedidos(status);
CREATE INDEX ON entregadores(usuario_id);
