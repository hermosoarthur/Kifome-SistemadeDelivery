package com.kifome.app.domain.model

data class Restaurante(
    val id: Int,
    val nomeFantasia: String,
    val categoria: String,
    val descricao: String?,
    val imagemUrl: String?,
    val taxaEntrega: Double,
    val tempoEstimado: Int,
    val avaliacaoMedia: Double?,
    val status: String
)

