-- Kifome v3 — Execute no Supabase SQL Editor

DROP TABLE IF EXISTS itens_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS entregadores CASCADE;
DROP TABLE IF EXISTS restaurantes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255),
    telefone VARCHAR(20),
    tipo VARCHAR(20) NOT NULL DEFAULT 'cliente',
    supabase_uid VARCHAR(255) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE restaurantes (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(200) NOT NULL,
    descricao TEXT,
    endereco VARCHAR(500) NOT NULL,
    telefone VARCHAR(20),
    categoria VARCHAR(100),
    imagem_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'aprovado',
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    preco FLOAT NOT NULL,
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
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    endereco_entrega VARCHAR(500) NOT NULL,
    total FLOAT NOT NULL DEFAULT 0,
    observacao TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario FLOAT NOT NULL
);

-- Indexes
CREATE INDEX ON usuarios(email);
CREATE INDEX ON restaurantes(usuario_id);
CREATE INDEX ON restaurantes(status);
CREATE INDEX ON produtos(restaurante_id);
CREATE INDEX ON pedidos(cliente_id);
CREATE INDEX ON pedidos(restaurante_id);
CREATE INDEX ON pedidos(status);
CREATE INDEX ON entregadores(usuario_id);
