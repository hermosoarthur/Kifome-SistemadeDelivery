# 🏷️ Kifome · Next-Gen Delivery Ecosystem

A revolução do delivery local sem fricção. Um ecossistema Full-Stack de alta performance, projetado sob os pilares de Design Thinking e engenharia moderna para eliminar barreiras de entrada, otimizar a conversão e conectar clientes e restaurantes em tempo real.

---

# 🎯 O PROBLEMA E A SOLUÇÃO

## ❌ O Cenário Atual (O Problema)

Plataformas tradicionais sofrem com altas taxas de abandono logo no onboarding devido a fluxos de cadastro complexos e recuperação de senhas obsoletas.

Além disso, sistemas de endereço rígidos geram atrito severo no checkout, resultando em perda de conversão para os restaurantes e uma experiência frustrante para o usuário final.

## ✔️ A Abordagem Kifome (A Solução)

O Kifome redefine a experiência de delivery através de uma arquitetura **100% Passwordless** (autenticação sem senha via OTP e OAuth), reduzindo o tempo de onboarding a segundos.

Combinando uma interface fluida em React com um motor geográfico inteligente (Google Maps API), a plataforma garante uma jornada de compra sem fricção, sustentada por um ecossistema robusto, seguro e altamente escalável.

---

# 📱 O ECOSSISTEMA (FEATURES CORE)

O ecossistema é integrado de ponta a ponta, conectando múltiplos perfis com regras de negócio centralizadas e comunicação via API RESTful de alta performance.

## 🔐 1. Autenticação Passwordless & Segura

### Acesso Instantâneo
- Login ágil via OTP (One-Time Password) enviado por E-mail ou SMS.

### Login Social
- Integração nativa com Google e Facebook via Supabase OAuth.

### Sincronização em Tempo Real
- Sincronização automatizada entre o provedor de autenticação externo e a base de dados local (`/sync_supabase_user`), eliminando fluxos legados de senha.

---

## 📱 2. Jornada Inteligente do Cliente

### Geolocalização Avançada
- Seleção de endereço por autocomplete integrada a mapa com marcador visual dinâmico.
- Botão de geolocalização por hardware.
- Fallback manual inteligente.

### Smart Checkout
- Persistência de carrinho.
- Salvamento automático do endereço principal do usuário.
- Flexibilidade para troca rápida antes da finalização do pedido.

### Fluxo de Descoberta
- Navegação fluida por catálogos de restaurantes.
- Gerenciamento de itens.
- Acompanhamento de status em tempo real.

---

## 🏪 3. Gestão do Restaurante

### Live Menu Manager
- CRUD completo e intuitivo para gerenciamento de produtos, categorias e cardápio em tempo real.

### Order Control
- Painel operacional reativo focado na atualização rápida do fluxo de status dos pedidos recebidos.

---

# 🛠️ ARQUITETURA E TECH STACK

A aplicação adota o princípio de **Separação de Responsabilidades (SoC)**, garantindo alta manutenibilidade e escalabilidade para o ecossistema.

## 🗂️ Organização dos Repositórios

```plaintext
├── backend/app              # Backend Flask (API Stateless)
│   ├── config/              # Configurações dinâmicas por ambiente
│   ├── controllers/         # Regras de negócio e processamento de requisições
│   ├── models/              # Modelos relacionais SQLAlchemy (PostgreSQL)
│   ├── routes/              # Definição e agrupamento dos endpoints REST
│   └── utils/               # Core helpers (JWT, OTP, validações e integrações)
│
├── frontend/src             # Frontend React 18 (SPA)
│   ├── components/          # Componentes modulares e reutilizáveis de UI
│   ├── contexts/            # Estados globais unificados (AuthContext, CartContext)
│   ├── pages/               # Views divididas por domínio (Cliente, Restaurante, Shared)
│   ├── services/            # Camada de comunicação com API REST e Supabase Client
│   └── styles/              # Arquitetura de estilos modulares por componente
```

---

## 💻 Stack Tecnológica

| Camada | Tecnologia | Papel Estratégico |
|----------|------------|-------------------|
| Backend Core | Python 3 + Flask | API RESTful ágil, centralização de regras de negócio e roteamento |
| ORM & Token | SQLAlchemy + PyJWT | Abstração segura da camada de dados e gerenciamento de sessões |
| Frontend | React 18 + React Router DOM | Interface SPA modular, reativa e focada em UX |
| Integração API | Axios | Requisições HTTP otimizadas e tratamento de erros |
| BaaS / Infra | Supabase (Python/JS SDK) | Fluxos Passwordless, SMS/Email OTP e OAuth Social |
| Banco de Dados | PostgreSQL | Persistência relacional robusta com conformidade ACID |
| Geolocalização | @react-google-maps/api | Mapas, autocomplete e experiência visual avançada |

---

# 📊 ENGENHARIA DE DADOS

O coração do Kifome baseia-se em um modelo relacional planejado para garantir máxima consistência, rastreabilidade e integridade das informações de ponta a ponta.

---

## 📡 Endpoints de Autenticação (`/api/auth`)

A API expõe rotas otimizadas para o fluxo passwordless, garantindo transições seguras sem expor dados sensíveis.

### OTP por E-mail

```http
POST /request_otp_email
POST /verify_otp_email
```

### OTP por SMS

```http
POST /request_otp_sms
POST /verify_otp_sms
```

### OAuth Social

```http
POST /login_google
POST /login_facebook
```

### Sincronização e Sessão

```http
GET  /me
POST /sync_supabase_user
```

### 🔒 Segurança Arquitetural

O modelo físico assegura:

- Mapeamento correto de chaves estrangeiras (FKs)
- Índices otimizados para consulta rápida de pedidos
- Políticas rígidas de relacionamento
- Sincronização segura de usuários locais e externos
- Eliminação de inconsistências de dados

---

# 🚀 COMO EXECUTAR O MVP

## Pré-requisitos

- Python 3.10+
- Node.js 18+

---

## 🖥️ 1. Configurando o Back-end (Flask API)

```bash
# Navegar até o diretório do backend
cd backend

# Criar e ativar o ambiente virtual
python -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Executar servidor
flask run
```

---

## 🌐 2. Configurando o Front-end (React)

```bash
# Navegar até o frontend
cd ../frontend

# Instalar dependências
npm install

# Iniciar aplicação
npm start
```

---

# 🎯 Diferenciais Competitivos

✅ Arquitetura 100% Passwordless

✅ Login Social (Google e Facebook)

✅ Geolocalização Inteligente

✅ Checkout Sem Fricção

✅ Painel Operacional para Restaurantes

✅ Sincronização em Tempo Real

✅ Backend Escalável em Flask

✅ Frontend SPA em React 18

✅ PostgreSQL + Supabase

✅ Design Thinking aplicado à experiência do usuário

---

## 📌 Visão

Transformar o delivery local em uma experiência rápida, personalizada e sem barreiras, conectando consumidores e restaurantes através de tecnologia moderna, acessível e escalável.
