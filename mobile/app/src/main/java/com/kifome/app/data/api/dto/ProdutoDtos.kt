package com.kifome.app.data.api.dto

import com.google.gson.annotations.SerializedName

data class ProdutoDto(
    val id: String,
    @SerializedName("restaurante_id") val restauranteId: String,
    val nome: String,
    val descricao: String? = null,
    val preco: Double,
    val categoria: String? = null,
    @SerializedName("imagem_url") val imagemUrl: String? = null,
    val disponivel: Boolean = true
)

data class CriarProdutoRequest(
    val nome: String,
    val descricao: String? = null,
    val preco: Double,
    val categoria: String? = null,
    val disponivel: Boolean = true
)

data class UpdateProdutoRequest(
    val nome: String? = null,
    val descricao: String? = null,
    val preco: Double? = null,
    val categoria: String? = null,
    val disponivel: Boolean? = null
)

