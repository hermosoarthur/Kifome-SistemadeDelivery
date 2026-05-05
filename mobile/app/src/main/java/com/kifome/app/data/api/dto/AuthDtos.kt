package com.kifome.app.data.api.dto

import com.google.gson.annotations.SerializedName

data class EmailRequest(val email: String)

data class SmsRequest(val telefone: String)

data class VerifyOtpRequest(
    val email: String,
    val codigo: String,
    val tipo: String = "cliente"
)

data class VerifyOtpSmsRequest(
    val telefone: String,
    val codigo: String
)

data class AuthResponse(
    val token: String,
    val usuario: UsuarioDto
)

data class UsuarioDto(
    val id: String,
    val nome: String,
    val email: String,
    val telefone: String? = null,
    val tipo: String,
    @SerializedName("endereco_principal") val enderecoPrincipal: String? = null,
    @SerializedName("endereco_json") val enderecoJson: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerializedName("tem_endereco") val temEndereco: Boolean = false,
    @SerializedName("avatar_url") val avatarUrl: String? = null,
    val ativo: Boolean = true
)

data class UpdateUsuarioRequest(
    val nome: String? = null,
    val telefone: String? = null
)

data class UpdateEnderecoRequest(
    @SerializedName("endereco_principal") val enderecoPrincipal: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null
)

data class MessageResponse(
    val mensagem: String,
    val provider: String? = null,
    @SerializedName("codigo_dev") val codigoDev: String? = null
)
