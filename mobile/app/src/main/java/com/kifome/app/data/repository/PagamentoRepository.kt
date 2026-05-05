package com.kifome.app.data.repository

import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.api.dto.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PagamentoRepository @Inject constructor(private val api: KifomeApi) {

    suspend fun criarPreferencia(pedidoId: String): Result<PreferenciaResponse> = runCatching {
        val response = api.criarPreferencia(PreferenciaRequest(pedidoId))
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao gerar preferência")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun statusPagamento(pedidoId: String): Result<PagamentoStatusResponse> = runCatching {
        val response = api.statusPagamento(pedidoId)
        if (response.isSuccessful) response.body() ?: throw Exception("Status não encontrado")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun confirmarSandbox(pedidoId: String): Result<String> = runCatching {
        val response = api.confirmarPagamento(pedidoId)
        if (response.isSuccessful) response.body()?.mensagem ?: "Pagamento confirmado"
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }
}

