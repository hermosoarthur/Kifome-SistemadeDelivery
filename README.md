# Kifome-SistemadeDelivery

## Configuração de ambiente (frontend)

Crie o arquivo `frontend/.env` a partir de `frontend/.env.example` e preencha:

- `REACT_APP_API_URL`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_GOOGLE_MAPS_API_KEY`

> Se `REACT_APP_GOOGLE_MAPS_API_KEY` não estiver configurada, o app continua funcionando com preenchimento manual de endereço.

## Endereço com Google Maps

O projeto agora possui fluxo de endereço para cliente inspirado em apps de delivery:

- seleção por autocomplete + mapa com marcador
- botão de geolocalização
- fallback manual (logradouro, número, bairro, cidade, UF, CEP, complemento, referência)
- salvamento de endereço principal do usuário
- reaproveitamento no carrinho e possibilidade de troca no checkout

## Migração de banco (backend)

Execute o SQL incremental:

- `backend/database_migrations/2026_03_endereco_usuario.sql`

Essa migração adiciona:

- dados de endereço principal em `usuarios`
- metadados geográficos em `pedidos`