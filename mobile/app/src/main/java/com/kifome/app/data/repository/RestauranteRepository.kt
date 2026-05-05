package com.kifome.app.data.repository

import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.api.dto.CriarRestauranteRequest
import com.kifome.app.data.api.dto.RestauranteDto
import com.kifome.app.data.api.dto.UpdateRestauranteRequest
import com.kifome.app.data.demo.DemoSeedData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RestauranteRepository @Inject constructor(
    private val api: KifomeApi
) {
    suspend fun listar(params: Map<String, String> = emptyMap()): Result<List<RestauranteDto>> =
        runCatching {
            val response = api.listarRestaurantes(params)
            if (response.isSuccessful) {
                val payload = response.body().orEmpty()
                if (payload.isNotEmpty()) {
                    payload
                } else {
                    DemoSeedData.filtrarRestaurantes(params["busca"], params["categoria"])
                }
            } else {
                DemoSeedData.filtrarRestaurantes(params["busca"], params["categoria"])
            }
        }.recoverCatching {
            DemoSeedData.filtrarRestaurantes(params["busca"], params["categoria"])
        }

    suspend fun obter(id: String): Result<RestauranteDto> = runCatching {
        val response = api.obterRestaurante(id)
        if (response.isSuccessful) {
            response.body() ?: DemoSeedData.restaurantes.firstOrNull { it.id == id }
            ?: throw Exception("Restaurante não encontrado")
        } else {
            DemoSeedData.restaurantes.firstOrNull { it.id == id }
                ?: throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
        }
    }.recoverCatching {
        DemoSeedData.restaurantes.firstOrNull { it.id == id }
            ?: throw it
    }

    suspend fun meuRestaurante(): Result<RestauranteDto> = runCatching {
        val response = api.meuRestaurante()
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Restaurante não encontrado")
        } else {
            throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
        }
    }

    suspend fun criar(body: CriarRestauranteRequest): Result<RestauranteDto> = runCatching {
        val response = api.criarRestaurante(body)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Erro ao criar restaurante")
        } else {
            throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
        }
    }

    suspend fun atualizar(id: String, body: UpdateRestauranteRequest): Result<RestauranteDto> = runCatching {
        val response = api.updateRestaurante(id, body)
        if (response.isSuccessful) {
            response.body() ?: throw Exception("Erro ao atualizar restaurante")
        } else {
            throw Exception("Erro ${response.code()}: ${response.errorBody()?.string()}")
        }
    }
}
