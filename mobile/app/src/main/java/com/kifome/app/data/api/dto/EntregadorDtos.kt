package com.kifome.app.data.api.dto

import com.google.gson.annotations.SerializedName

data class EntregadorDto(
    val id: String,
    @SerializedName("usuario_id") val usuarioId: String,
    val veiculo: String,
    val placa: String? = null,
    val disponivel: Boolean = true,
    val nota: Double? = null,
    @SerializedName("cnh_numero") val cnhNumero: String? = null
)

data class CriarEntregadorRequest(
    val veiculo: String,
    val placa: String? = null,
    @SerializedName("cnh_numero") val cnhNumero: String? = null
)

data class UpdateEntregadorRequest(
    val veiculo: String? = null,
    val placa: String? = null,
    val disponivel: Boolean? = null
)

