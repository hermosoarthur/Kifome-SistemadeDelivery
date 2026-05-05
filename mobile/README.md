# 🍊 Kifome — App Android

Aplicativo Android nativo de delivery, desenvolvido em **Kotlin + Jetpack Compose**, que consome a API REST do Kifome em produção no Render.

---

## 🌐 Backend (Produção)

| Item              | Valor                                       |
|-------------------|---------------------------------------------|
| **Debug URL**     | `http://10.0.2.2:5002/` (backend local)     |
| **Release URL**   | `https://kifome-backend.onrender.com/`      |
| **Auth**          | JWT Bearer Token                            |
| **Header**        | `Authorization: Bearer <token>`             |
| **Cold Start**    | ~30s na primeira requisição (free tier)     |

> ℹ️ Em debug, o app prioriza backend local para acelerar testes de OTP e fluxo completo.

---

## 🏗️ Stack Técnica

- **Linguagem**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Arquitetura**: MVVM + Clean Architecture (data / domain / presentation)
- **DI**: Hilt
- **HTTP**: Retrofit2 + OkHttp + Gson
- **Async**: Coroutines + StateFlow
- **Storage**: DataStore Preferences
- **Navegação**: Navigation Compose
- **Imagens**: Coil
- **minSdk**: 26 | **targetSdk**: 35

---

## 🚀 Como rodar no emulador

### Pré-requisitos
- Android Studio Hedgehog ou superior
- Emulador com API 26+ (Pixel recomendado)

### Passos
```bash
# 1. Clone o repositório (branch mobile)
git clone -b mobile https://github.com/hermosoarthur/Kifome-SistemadeDelivery.git
cd Kifome-SistemadeDelivery

# 2. Abra no Android Studio
# File → Open → selecione a pasta do projeto

# 3. Aguarde a sincronização do Gradle

# 4. Inicie o emulador (Tools → Device Manager)

# 5. Execute o app (Shift+F10 ou botão ▶)
```

> 💡 Na primeira execução, o servidor pode levar ~30s para responder (cold start do Render). O app mostra "Conectando ao servidor... aguarde." automaticamente.

---

## 🧪 Backend local (fallback quando Render falhar)

```powershell
cd E:\Kifome-SistemadeDelivery\backend
$env:PORT="5002"
$env:FLASK_DEBUG="0"
python -u run.py
```

Teste rápido OTP:

```powershell
$body = @{ email = "seuemail@teste.com" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://127.0.0.1:5002/api/auth/request_otp_email" -Method Post -ContentType "application/json" -Body $body -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 📱 Como rodar no celular físico (APK Debug)

### Via Android Studio
1. Ative **Modo Desenvolvedor** no celular (Configurações → Sobre → toque 7x em "Número da versão")
2. Ative **Depuração USB** nas opções de desenvolvedor
3. Conecte o cabo USB
4. Selecione o dispositivo no Android Studio
5. Execute com `Shift+F10`

### Via APK
```bash
# Gerar APK debug
./gradlew assembleDebug

# APK gerado em:
# app/build/outputs/apk/debug/app-debug.apk

# Instalar via ADB
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔐 Fluxo completo de Login OTP

```
┌─────────────────┐
│  SplashScreen   │  → Verifica token no DataStore
└────────┬────────┘
         │ token válido?
    ┌────┴────┐
   Sim       Não
    │         │
    ▼         ▼
 HomeCliente  LoginScreen
(ou Dash)    │
             ├─ Aba E-mail: digita email → "Receber código"
             ├─ Aba SMS: digita telefone → "Receber código"
             │
             ▼
          OtpScreen
             │
             ├─ Campo de 6 dígitos
             ├─ Timer de 60s para reenvio
             ├─ Confirmar → POST /api/auth/verify_otp_email (ou _sms)
             │
             ▼
          Salva token + usuário + tipo no DataStore
             │
             ▼
    Redireciona por tipo:
    ├─ cliente    → HomeClienteScreen
    ├─ restaurante → RestauranteDashScreen
    └─ entregador → EntregadorDashScreen
```

### Tratamento de 401
Se qualquer requisição retornar **401 Unauthorized**:
1. Token é removido do DataStore automaticamente
2. App redireciona para `LoginScreen` com back-stack limpo

---

## 📦 Estrutura de Pacotes

```
com.kifome.app/
├── data/
│   ├── api/
│   │   ├── ApiClient.kt          # Retrofit + OkHttp (30s timeout)
│   │   ├── KifomeApi.kt          # Todos os endpoints
│   │   └── dto/                  # AuthDtos, RestauranteDtos, ProdutoDtos, ...
│   ├── local/
│   │   └── TokenDataStore.kt     # JWT + usuário no DataStore
│   └── repository/               # AuthRepo, RestauranteRepo, PedidoRepo, ...
├── di/
│   ├── AppModule.kt              # Hilt providers
│   └── AuthEventChannel.kt       # Canal para eventos 401
├── navigation/
│   └── NavGraph.kt               # Todas as rotas
└── ui/
    ├── splash/                   # SplashScreen + ViewModel
    ├── auth/                     # LoginScreen, OtpScreen, AuthViewModel
    ├── home/                     # HomeScreen, RestauranteCard, HomeViewModel
    ├── detail/                   # RestauranteDetalheScreen + ViewModel
    ├── cliente/                  # Carrinho, Acompanhar, MeusPedidos
    ├── restaurante/              # Dash, Pedidos, Produtos, MeuRestaurante
    ├── entregador/               # Dash, Entregas, ValidarEntrega
    ├── shared/                   # PerfilScreen
    └── theme/                    # Color, Theme, Type
```

---

## 🎨 Cores do App

| Token          | Valor     | Uso                     |
|----------------|-----------|-------------------------|
| Primary        | `#FF6B35` | Laranja Kifome          |
| OnPrimary      | `#FFFFFF` | Texto sobre laranja      |
| Background     | `#FFF8F5` | Fundo das telas         |
| Surface        | `#FFFFFF` | Cards e superfícies     |
| Error          | `#B00020` | Erros e alertas         |

---

## 🔧 Configuração de Segurança de Rede

O arquivo `res/xml/network_security_config.xml` bloqueia tráfego HTTP (cleartext) — apenas HTTPS é permitido. Isso é correto pois o backend usa `https://kifome-backend.onrender.com/`.

---

## 📝 Variáveis Externas (não expor no código)

```
GOOGLE_MAPS_KEY = your_google_maps_api_key
SUPABASE_URL    = https://your-project-id.supabase.co
SUPABASE_ANON_KEY = your_supabase_anon_key
```

