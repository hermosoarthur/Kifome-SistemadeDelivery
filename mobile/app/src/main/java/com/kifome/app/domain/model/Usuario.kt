package com.kifome.app.domain.model

data class Usuario(
    val id: Int,
    val nome: String,
    val email: String?,
    val tipo: String,
    val telefone: String?
)

