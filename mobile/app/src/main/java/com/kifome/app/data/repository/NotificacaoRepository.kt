package com.kifome.app.data.repository

import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.api.dto.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificacaoRepository @Inject constructor(private val api: KifomeApi) {

    suspend fun minhasNotificacoes(): Result<List<NotificacaoDto>> = runCatching {
        val response = api.minhasNotificacoes()
        if (response.isSuccessful) response.body() ?: emptyList()
        else throw Exception("Erro ${response.code()}")
    }

    // Alias para compatibilidade
    suspend fun minhas(): Result<List<NotificacaoDto>> = minhasNotificacoes()

    suspend fun marcarComoLida(id: String): Result<String> = runCatching {
        val response = api.marcarLida(id)
        if (response.isSuccessful) response.body()?.mensagem ?: "Marcada como lida"
        else throw Exception("Erro ${response.code()}")
    }

    // Alias para compatibilidade
    suspend fun marcarLida(id: String): Result<String> = marcarComoLida(id)

    suspend fun marcarTodasLidas(): Result<String> = runCatching {
        val response = api.marcarTodasLidas()
        if (response.isSuccessful) response.body()?.mensagem ?: "Todas marcadas como lidas"
        else throw Exception("Erro ${response.code()}")
    }
}
