package com.kifome.app.data.repository

import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.api.dto.ProdutoDto
import com.kifome.app.data.api.dto.CriarProdutoRequest
import com.kifome.app.data.api.dto.UpdateProdutoRequest
import com.kifome.app.data.demo.DemoSeedData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProdutoRepository @Inject constructor(private val api: KifomeApi) {

    suspend fun listar(restauranteId: String): Result<List<ProdutoDto>> = runCatching {
        val response = api.listarProdutos(restauranteId)
        if (response.isSuccessful) {
            val payload = response.body().orEmpty()
            if (payload.isNotEmpty()) payload
            else DemoSeedData.produtosPorRestaurante[restauranteId].orEmpty()
        } else {
            DemoSeedData.produtosPorRestaurante[restauranteId].orEmpty()
        }
    }.recoverCatching {
        DemoSeedData.produtosPorRestaurante[restauranteId].orEmpty()
    }

    suspend fun criar(restauranteId: String, body: CriarProdutoRequest): Result<ProdutoDto> = runCatching {
        val response = api.criarProduto(restauranteId, body)
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao criar produto")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun atualizar(restauranteId: String, produtoId: String, body: UpdateProdutoRequest): Result<ProdutoDto> = runCatching {
        val response = api.updateProduto(restauranteId, produtoId, body)
        if (response.isSuccessful) response.body() ?: throw Exception("Erro ao atualizar produto")
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }

    suspend fun deletar(restauranteId: String, produtoId: String): Result<String> = runCatching {
        val response = api.deleteProduto(restauranteId, produtoId)
        if (response.isSuccessful) response.body()?.mensagem ?: "Produto removido"
        else throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
    }
}

