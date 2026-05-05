package com.kifome.app.data.dto

data class RestauranteDto(
    val id: Int,
    val nome_fantasia: String,
    val categoria: String,
    val descricao: String?,
    val imagem_url: String?,
    val taxa_entrega: Double,
    val tempo_estimado: Int,
    val avaliacao_media: Double?,
    val status: String
)

data class ListaRestaurantesResponse(
    val restaurantes: List<RestauranteDto>,
    val total: Int
)

