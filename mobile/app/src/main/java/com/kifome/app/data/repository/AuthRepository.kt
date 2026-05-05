package com.kifome.app.data.repository

import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.api.dto.AuthResponse
import com.kifome.app.data.api.dto.EmailRequest
import com.kifome.app.data.api.dto.SmsRequest
import com.kifome.app.data.api.dto.UpdateEnderecoRequest
import com.kifome.app.data.api.dto.UpdateUsuarioRequest
import com.kifome.app.data.api.dto.UsuarioDto
import com.kifome.app.data.api.dto.VerifyOtpRequest
import com.kifome.app.data.api.dto.VerifyOtpSmsRequest
import com.kifome.app.data.local.TokenDataStore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: KifomeApi,
    private val tokenDataStore: TokenDataStore
) {
    private fun extractApiMessage(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        val mensagem = "\"mensagem\"\\s*:\\s*\"([^\"]+)\"".toRegex().find(raw)?.groupValues?.getOrNull(1)
        val erro = "\"erro\"\\s*:\\s*\"([^\"]+)\"".toRegex().find(raw)?.groupValues?.getOrNull(1)
        return mensagem ?: erro
    }

    suspend fun requestOtp(email: String): Result<com.kifome.app.data.api.dto.MessageResponse> = runCatching {
        val response = api.requestOtpEmail(EmailRequest(email))
        if (response.isSuccessful) {
            response.body() ?: com.kifome.app.data.api.dto.MessageResponse("Código enviado com sucesso!")
        } else {
            val rawError = response.errorBody()?.string() ?: ""
            val apiMessage = extractApiMessage(rawError)
            throw Exception(apiMessage ?: "Erro ${response.code()} ao solicitar OTP.\n$rawError".take(120))
        }
    }.recoverCatching { e ->
        // Timeout ou sem internet: relança com mensagem amigável
        val msg = when {
            e.message?.contains("timeout", ignoreCase = true) == true ->
                "Servidor demorando para responder (Render hibernado).\nAguarde ~60s e tente novamente."
            e.message?.contains("Unable to resolve host", ignoreCase = true) == true ->
                "Sem conexão com a internet. Verifique o Wi-Fi do emulador."
            else -> e.message ?: "Erro de rede ao solicitar OTP."
        }
        throw Exception(msg)
    }

    suspend fun verifyOtp(email: String, codigo: String): Result<AuthResponse> = runCatching {
        val response = api.verifyOtpEmail(VerifyOtpRequest(email, codigo))
        if (response.isSuccessful) {
            val authResponse = response.body() ?: throw Exception("Resposta inválida do servidor")
            tokenDataStore.saveToken(authResponse.token)
            tokenDataStore.saveUserInfo(
                authResponse.usuario.id,
                authResponse.usuario.nome,
                authResponse.usuario.tipo
            )
            authResponse
        } else {
            val apiMessage = extractApiMessage(response.errorBody()?.string())
            throw Exception(apiMessage ?: "Código inválido ou expirado. Tente novamente.")
        }
    }

    suspend fun requestOtpSms(telefone: String): Result<String> = runCatching {
        val response = api.requestOtpSms(SmsRequest(telefone))
        if (response.isSuccessful) {
            response.body()?.mensagem ?: "Código enviado por SMS!"
        } else {
            throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
        }
    }

    suspend fun verifyOtpSms(telefone: String, codigo: String): Result<AuthResponse> = runCatching {
        val response = api.verifyOtpSms(VerifyOtpSmsRequest(telefone, codigo))
        if (response.isSuccessful) {
            val authResponse = response.body() ?: throw Exception("Resposta inválida do servidor")
            tokenDataStore.saveToken(authResponse.token)
            tokenDataStore.saveUserInfo(
                authResponse.usuario.id,
                authResponse.usuario.nome,
                authResponse.usuario.tipo
            )
            authResponse
        } else {
            throw Exception("Código SMS inválido ou expirado.")
        }
    }

    suspend fun getMe(): Result<UsuarioDto> = runCatching {
        val response = api.getMe()
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Usuário não encontrado")
        } else {
            throw Exception("Erro ao buscar perfil: ${response.code()}")
        }
    }

    suspend fun updatePerfil(id: String, nome: String, telefone: String): Result<UsuarioDto> = runCatching {
        val response = api.updateUsuario(id, UpdateUsuarioRequest(nome = nome, telefone = telefone.ifBlank { null }))
        if (response.isSuccessful) {
            val user = response.body() ?: throw Exception("Erro ao atualizar")
            tokenDataStore.saveUserInfo(user.id, user.nome, user.tipo)
            user
        } else {
            throw Exception("Erro ao atualizar perfil: ${response.code()}")
        }
    }

    suspend fun updateEndereco(id: String, endereco: String): Result<UsuarioDto> = runCatching {
        val response = api.updateEndereco(id, UpdateEnderecoRequest(enderecoPrincipal = endereco))
        if (response.isSuccessful) {
            val user = response.body() ?: throw Exception("Erro ao atualizar")
            tokenDataStore.saveEndereco(endereco)
            user
        } else {
            throw Exception("Erro ao atualizar endereço: ${response.code()}")
        }
    }

    suspend fun logout() {
        tokenDataStore.clearToken()
    }
}
