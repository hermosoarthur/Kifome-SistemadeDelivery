package com.kifome.app.data.api.dto

import com.google.gson.annotations.SerializedName

data class PedidoDto(
    val id: String,
    @SerializedName("restaurante_id") val restauranteId: String,
    @SerializedName("usuario_id") val usuarioId: String,
    val status: String,
    val total: Double = 0.0,
    val itens: List<ItemPedidoDto>? = null,
    @SerializedName("endereco_entrega") val enderecoEntrega: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("restaurante_nome") val restauranteNome: String? = null,
    @SerializedName("metodo_pagamento") val metodoPagamento: String? = null,
    @SerializedName("tipo_entrega") val tipoEntrega: String? = null,
    val observacoes: String? = null
)

data class ItemPedidoDto(
    val id: String = "",
    @SerializedName("produto_id") val produtoId: String,
    val quantidade: Int,
    @SerializedName("preco_unit") val precoUnit: Double,
    val nome: String? = null,
    val observacao: String? = null
)

data class CriarPedidoRequest(
    @SerializedName("restaurante_id") val restauranteId: String,
    val itens: List<ItemPedidoRequest>,
    @SerializedName("endereco_entrega") val enderecoEntrega: String,
    @SerializedName("metodo_pagamento") val metodoPagamento: String = "dinheiro",
    @SerializedName("tipo_entrega") val tipoEntrega: String = "padrao",
    val observacoes: String? = null
)

data class ItemPedidoRequest(
    @SerializedName("produto_id") val produtoId: String,
    val quantidade: Int,
    @SerializedName("preco_unit") val precoUnit: Double,
    val observacao: String? = null
)

data class AtualizarStatusRequest(val status: String)

data class AvaliarPedidoRequest(
    val nota: Int,
    val comentario: String? = null
)

data class ValidarEntregaRequest(val codigo: String)

data class CodigoEntregaResponse(val codigo: String)
