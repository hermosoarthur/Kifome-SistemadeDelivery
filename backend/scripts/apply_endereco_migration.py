from sqlalchemy import text
from app import create_app, db


def main():
    app = create_app()
    with app.app_context():
        statements = [
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_principal VARCHAR(500)",
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_json JSONB",
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION",
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION",
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tem_endereco BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_detalhes JSONB",
            "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_latitude DOUBLE PRECISION",
            "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_longitude DOUBLE PRECISION",
            "UPDATE usuarios SET tem_endereco = CASE WHEN endereco_principal IS NOT NULL AND TRIM(endereco_principal) <> '' THEN TRUE ELSE FALSE END",
        ]

        for stmt in statements:
            db.session.execute(text(stmt))
        db.session.commit()
        print("Migração de endereço aplicada com sucesso.")


if __name__ == "__main__":
    main()
