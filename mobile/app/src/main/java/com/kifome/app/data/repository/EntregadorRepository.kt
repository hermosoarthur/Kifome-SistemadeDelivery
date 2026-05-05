package com.kifome.app.data.repository

import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.api.dto.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EntregadorRepository @Inject constructor(private val api: KifomeApi) {

    suspend fun criar(veiculo: String, placa: String?): Result<EntregadorDto> = runCatching {
        val response = api.criarEntregador(CriarEntregadorRequest(veiculo = veiculo, placa = placa))
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao criar perfil")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun meuPerfil(): Result<EntregadorDto> = runCatching {
        val response = api.meuPerfilEntregador()
        if (response.isSuccessful) response.body() ?: throw Exception("Perfil não encontrado")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun atualizar(id: String, disponivel: Boolean): Result<EntregadorDto> = runCatching {
        val response = api.updateEntregador(id, UpdateEntregadorRequest(disponivel = disponivel))
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao atualizar")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }
}

