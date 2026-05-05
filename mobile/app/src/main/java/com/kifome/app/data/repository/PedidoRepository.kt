package com.kifome.app.data.repository

import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.api.dto.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PedidoRepository @Inject constructor(private val api: KifomeApi) {

    suspend fun criar(body: CriarPedidoRequest): Result<PedidoDto> = runCatching {
        val response = api.criarPedido(body)
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao criar pedido")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun meusPedidos(): Result<List<PedidoDto>> = runCatching {
        val response = api.meusPedidos()
        if (response.isSuccessful) response.body() ?: emptyList()
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun pedidosRestaurante(restauranteId: String): Result<List<PedidoDto>> = runCatching {
        val response = api.pedidosRestaurante(restauranteId)
        if (response.isSuccessful) response.body() ?: emptyList()
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun atualizarStatus(pedidoId: String, status: String): Result<PedidoDto> = runCatching {
        val response = api.atualizarStatus(pedidoId, AtualizarStatusRequest(status))
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao atualizar status")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun avaliar(pedidoId: String, nota: Int, comentario: String?): Result<String> = runCatching {
        val response = api.avaliarPedido(pedidoId, AvaliarPedidoRequest(nota, comentario))
        if (response.isSuccessful) response.body()?.mensagem ?: "Avaliação enviada"
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun pedidosDisponiveis(): Result<List<PedidoDto>> = runCatching {
        val response = api.pedidosDisponiveis()
        if (response.isSuccessful) response.body() ?: emptyList()
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun minhasEntregas(): Result<List<PedidoDto>> = runCatching {
        val response = api.minhasEntregas()
        if (response.isSuccessful) response.body() ?: emptyList()
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun validarEntrega(pedidoId: String, codigo: String): Result<String> = runCatching {
        val response = api.validarEntrega(pedidoId, ValidarEntregaRequest(codigo))
        if (response.isSuccessful) response.body()?.mensagem ?: "Entrega validada"
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun confirmarRecebimento(pedidoId: String): Result<String> = runCatching {
        val response = api.confirmarRecebimento(pedidoId)
        if (response.isSuccessful) response.body()?.mensagem ?: "Recebimento confirmado"
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun codigoEntrega(pedidoId: String): Result<String> = runCatching {
        val response = api.codigoEntrega(pedidoId)
        if (response.isSuccessful) response.body()?.codigo ?: throw Exception("Código não encontrado")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun simularPasso(pedidoId: String): Result<PedidoDto> = runCatching {
        val response = api.simularPasso(pedidoId)
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao simular passo")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }
}

