# Kifome — Sistema de Delivery

Plataforma fullstack inspirada em apps de delivery (como iFood), com suporte a múltiplos perfis de usuário, autenticação moderna sem senha e fluxo completo de pedidos.

---

## 📌 Visão geral do projeto

O **Kifome** é dividido em duas aplicações principais:

- **Backend** (`backend/`) em Flask, responsável por autenticação, regras de negócio e API REST.
- **Frontend** (`frontend/`) em React, responsável pela experiência do usuário (cliente, restaurante e entregador).

O projeto já está estruturado para operar com autenticação **passwordless** (sem senha), usando OTP, login social e integração com Supabase.

---

## 🚀 Funcionalidades principais

### Autenticação e conta

- Login sem senha via **OTP por e-mail**
- Login sem senha via **OTP por SMS**
- Login social com **Google** e **Facebook** (via Supabase OAuth)
- Sincronização de usuário autenticado com base local

### Perfis de usuário

- **Cliente**: navega em restaurantes, adiciona itens no carrinho, fecha pedido e acompanha status
- **Restaurante**: gerencia restaurante, cardápio/produtos e pedidos recebidos
- **Entregador**: visualiza pedidos disponíveis e gerencia entregas em andamento

### Catálogo e pedidos

- Listagem de restaurantes e produtos
- CRUD de produtos para restaurantes
- Criação e atualização de pedidos
- Fluxo de status de pedido por tipo de usuário

### Endereço e entrega

Fluxo de endereço inspirado em apps de delivery:

- seleção por autocomplete + mapa com marcador
- botão de geolocalização
- fallback manual (logradouro, número, bairro, cidade, UF, CEP, complemento, referência)
- salvamento de endereço principal do usuário
- reaproveitamento no carrinho e possibilidade de troca no checkout

---

## 🧱 Arquitetura e organização

### Backend (`backend/app`)

- `controllers/` → regras de negócio e processamento das requisições
- `routes/` → definição dos endpoints REST
- `models/` → modelos SQLAlchemy
- `utils/` → JWT, OTP, validações e integrações auxiliares
- `config/` → configurações por ambiente

### Frontend (`frontend/src`)

- `pages/` → telas por domínio (`cliente`, `restaurante`, `entregador`, `shared`)
- `components/` → componentes reutilizáveis de UI
- `contexts/` → estado global (`AuthContext`, `CartContext`)
- `services/` → camada de comunicação com API e Supabase
- `styles/` → tema e estilos globais

---

## 🛠️ Stack tecnológica

### Backend

- **Python 3**
- **Flask**
- **Flask-SQLAlchemy / SQLAlchemy**
- **PyJWT**
- **bcrypt**
- **Supabase Python SDK**
- **PostgreSQL** (via Supabase)

### Frontend

- **React 18**
- **React Router DOM**
- **Axios**
- **@supabase/supabase-js**
- **@react-google-maps/api**
- **CSS** (arquitetura modular por componente/página)

### Infra e execução

- **Node.js + npm** para frontend
- **pip + requirements.txt** para backend
- **Supabase** para autenticação social/OTP e base de dados

---

## ⚙️ Configuração de ambiente

### Frontend (`frontend/.env`)

Crie o arquivo `frontend/.env` a partir de `frontend/.env.example` e preencha:

- `REACT_APP_API_URL`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_GOOGLE_MAPS_API_KEY`

> Se `REACT_APP_GOOGLE_MAPS_API_KEY` não estiver configurada, o app continua funcionando com preenchimento manual de endereço.

### Backend (`backend/.env`)

Defina as variáveis do Flask e integração com Supabase/SMTP (quando aplicável), por exemplo:

- `FLASK_ENV`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY` ou `SUPABASE_SERVICE_KEY`
- `SMS_PROVIDER`
- `OTP_EXPIRATION_MINUTES`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`

---

## ▶️ Como executar

### Backend

```powershell
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend

```powershell
cd frontend
npm install
npm start
```

### Build de produção (frontend)

```powershell
cd frontend
npm run build
```

---

## 🗄️ Banco de dados

Schema base:

- `backend/database.sql`

Este projeto está configurado para usar **apenas** o `backend/database.sql` como fonte de verdade do schema.

---

## 🔐 Autenticação (modelo atual)

O projeto está orientado para autenticação **sem senha de usuário**:

- OTP por e-mail
- OTP por SMS
- OAuth com Google/Facebook

Fluxos legados de senha foram removidos para manter consistência com o produto.

---

## 📡 Endpoints principais (resumo)

Base de autenticação: `/api/auth`

- `POST /request_magic_link`
- `POST /verify_magic_link`
- `POST /request_otp_email`
- `POST /verify_otp_email`
- `POST /request_otp_sms`
- `POST /verify_otp_sms`
- `POST /login_google`
- `POST /login_facebook`
- `GET /me`
- `POST /sync_supabase_user`

Além disso, o backend expõe rotas para usuários, restaurantes, produtos, pedidos e entregadores.

---

## 👥 Perfis e jornadas no app

- **Cliente**: descoberta de restaurantes → carrinho → pedido → acompanhamento
- **Restaurante**: gestão de cardápio e pedidos
- **Entregador**: captação e execução de entregas

Essa separação já está refletida na estrutura de páginas em `frontend/src/pages/`.
