package com.kifome.app.data.dto

data class RequestOtpEmailRequest(val email: String)

data class VerifyOtpEmailRequest(
    val email: String,
    val codigo: String,
    val nome: String? = null,
    val tipo: String? = null,
    val telefone: String? = null
)

data class RequestOtpSmsRequest(val telefone: String)

data class VerifyOtpSmsRequest(
    val telefone: String,
    val codigo: String,
    val nome: String? = null,
    val tipo: String? = null
)

data class GoogleUserRequest(
    val nome: String? = null,
    val email: String? = null,
    val foto: String? = null
)

data class LoginGoogleRequest(
    val access_token: String,
    val id_token: String,
    val user: GoogleUserRequest? = null
)

data class AuthResponse(val token: String, val usuario: UsuarioDto)

data class UsuarioDto(
    val id: Int,
    val nome: String,
    val email: String?,
    val tipo: String,
    val telefone: String?
)

data class MeResponse(val usuario: UsuarioDto)

data class MessageResponse(val mensagem: String)

data class ErrorResponse(val erro: String?)

data class EmailJsSendRequest(
    val service_id: String,
    val template_id: String,
    val user_id: String,
    val template_params: Map<String, String>
)

data class EmailJsSendResponse(
    val status: String? = null,
    val text: String? = null
)


