package com.kifome.app.data.api.dto

import com.google.gson.annotations.SerializedName

data class PreferenciaRequest(
    @SerializedName("pedido_id") val pedidoId: String
)

data class PreferenciaResponse(
    val id: String,
    @SerializedName("init_point") val initPoint: String
)

data class PagamentoStatusResponse(
    val status: String,
    @SerializedName("pedido_id") val pedidoId: String
)

