package com.kifome.app.data.api.dto

import com.google.gson.annotations.SerializedName

data class NotificacaoDto(
    val id: String,
    val titulo: String,
    val mensagem: String,
    val lida: Boolean = false,
    val tipo: String? = null,
    @SerializedName("created_at") val createdAt: String? = null
)

