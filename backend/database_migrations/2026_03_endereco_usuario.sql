-- Migração incremental: endereço de usuário + metadados de endereço do pedido
-- Compatível com PostgreSQL (Supabase)

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_principal VARCHAR(500);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_json JSONB;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tem_endereco BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_detalhes JSONB;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_latitude DOUBLE PRECISION;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_longitude DOUBLE PRECISION;

UPDATE usuarios
SET tem_endereco = CASE
  WHEN endereco_principal IS NOT NULL AND TRIM(endereco_principal) <> '' THEN TRUE
  ELSE FALSE
END;
