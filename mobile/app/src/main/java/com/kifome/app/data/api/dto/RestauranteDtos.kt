package com.kifome.app.data.api.dto

import com.google.gson.annotations.SerializedName

data class RestauranteDto(
    val id: String,
    @SerializedName("nome_fantasia") val nomeFantasia: String,
    val descricao: String? = null,
    val endereco: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerializedName("endereco_json") val enderecoJson: String? = null,
    val telefone: String? = null,
    val categoria: String? = null,
    @SerializedName("imagem_url") val imagemUrl: String? = null,
    val status: String = "aberto",
    @SerializedName("usuario_id") val usuarioId: String = "",
    @SerializedName("taxa_entrega") val taxaEntrega: Double? = null,
    @SerializedName("tempo_estimado") val tempoEstimado: String? = null,
    val nota: Double? = null
)

data class CriarRestauranteRequest(
    @SerializedName("nome_fantasia") val nomeFantasia: String,
    val descricao: String? = null,
    val endereco: String,
    val telefone: String? = null,
    val categoria: String? = null,
    @SerializedName("taxa_entrega") val taxaEntrega: Double? = null,
    @SerializedName("tempo_estimado") val tempoEstimado: String? = null
)

data class UpdateRestauranteRequest(
    @SerializedName("nome_fantasia") val nomeFantasia: String? = null,
    val descricao: String? = null,
    val endereco: String? = null,
    val telefone: String? = null,
    val categoria: String? = null,
    val status: String? = null,
    @SerializedName("taxa_entrega") val taxaEntrega: Double? = null,
    @SerializedName("tempo_estimado") val tempoEstimado: String? = null
)
