package com.kifome.app.domain.model

data class EnderecoSelecionado(
    val rua: String,
    val numero: String,
    val bairro: String,
    val cidade: String,
    val estado: String,
    val cep: String?,
    val lat: Double,
    val lng: Double,
    val enderecoCompleto: String
)

