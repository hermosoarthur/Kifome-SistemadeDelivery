package com.kifome.app.data.repository.phase1

import com.google.gson.Gson
import com.kifome.app.core.network.ApiService
import com.kifome.app.core.util.Resource
import com.kifome.app.data.dto.ErrorResponse
import com.kifome.app.data.dto.RestauranteDto
import com.kifome.app.domain.model.Restaurante
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RestauranteRepositoryImpl @Inject constructor(
    private val api: ApiService
) : RestauranteRepository {

    override suspend fun listarRestaurantes(
        busca: String?,
        categoria: String?,
        page: Int,
        perPage: Int
    ): Resource<List<Restaurante>> = withContext(Dispatchers.IO) {
        try {
            val response = api.listarRestaurantes(busca, categoria, page, perPage)
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Resource.Success(body.restaurantes.map { it.toDomain() })
                } else {
                    Resource.Error("Resposta vazia do servidor")
                }
            } else {
                val raw = response.errorBody()?.string()
                val parsed = runCatching { Gson().fromJson(raw, ErrorResponse::class.java) }.getOrNull()
                Resource.Error(parsed?.erro ?: "Erro HTTP ${response.code()}")
            }
        } catch (io: IOException) {
            Resource.Error("Sem internet. Verifique sua conexão.")
        } catch (http: HttpException) {
            Resource.Error("Erro no servidor (${http.code()}).")
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Erro desconhecido")
        }
    }

    private fun RestauranteDto.toDomain(): Restaurante = Restaurante(
        id = id,
        nomeFantasia = nome_fantasia,
        categoria = categoria,
        descricao = descricao,
        imagemUrl = imagem_url,
        taxaEntrega = taxa_entrega,
        tempoEstimado = tempo_estimado,
        avaliacaoMedia = avaliacao_media,
        status = status
    )
}

