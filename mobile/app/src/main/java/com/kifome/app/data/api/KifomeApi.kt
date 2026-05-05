package com.kifome.app.data.api

import com.kifome.app.data.api.dto.*
import retrofit2.Response
import retrofit2.http.*

interface KifomeApi {

    // ── AUTH ──────────────────────────────────────────────────
    @POST("api/auth/request_otp_email")
    suspend fun requestOtpEmail(@Body body: EmailRequest): Response<MessageResponse>

    @POST("api/auth/verify_otp_email")
    suspend fun verifyOtpEmail(@Body body: VerifyOtpRequest): Response<AuthResponse>

    @POST("api/auth/request_otp_sms")
    suspend fun requestOtpSms(@Body body: SmsRequest): Response<MessageResponse>

    @POST("api/auth/verify_otp_sms")
    suspend fun verifyOtpSms(@Body body: VerifyOtpSmsRequest): Response<AuthResponse>

    @GET("api/auth/me")
    suspend fun getMe(): Response<UsuarioDto>

    // ── USUÁRIOS ──────────────────────────────────────────────
    @GET("api/usuarios/{id}")
    suspend fun getUsuario(@Path("id") id: String): Response<UsuarioDto>

    @PUT("api/usuarios/{id}")
    suspend fun updateUsuario(@Path("id") id: String, @Body body: UpdateUsuarioRequest): Response<UsuarioDto>

    @PUT("api/usuarios/{id}/endereco")
    suspend fun updateEndereco(@Path("id") id: String, @Body body: UpdateEnderecoRequest): Response<UsuarioDto>

    @DELETE("api/usuarios/{id}")
    suspend fun deleteUsuario(@Path("id") id: String): Response<MessageResponse>

    // ── RESTAURANTES ──────────────────────────────────────────
    @GET("api/restaurantes")
    suspend fun listarRestaurantes(@QueryMap params: Map<String, String>): Response<List<RestauranteDto>>

    @GET("api/restaurantes/{id}")
    suspend fun obterRestaurante(@Path("id") id: String): Response<RestauranteDto>

    @GET("api/restaurantes/meus")
    suspend fun meuRestaurante(): Response<RestauranteDto>

    @POST("api/restaurantes")
    suspend fun criarRestaurante(@Body body: CriarRestauranteRequest): Response<RestauranteDto>

    @PUT("api/restaurantes/{id}")
    suspend fun updateRestaurante(@Path("id") id: String, @Body body: UpdateRestauranteRequest): Response<RestauranteDto>

    @DELETE("api/restaurantes/{id}")
    suspend fun deleteRestaurante(@Path("id") id: String): Response<MessageResponse>

    // ── PRODUTOS ──────────────────────────────────────────────
    @GET("api/restaurantes/{rid}/produtos")
    suspend fun listarProdutos(@Path("rid") restauranteId: String): Response<List<ProdutoDto>>

    @POST("api/restaurantes/{rid}/produtos")
    suspend fun criarProduto(@Path("rid") restauranteId: String, @Body body: CriarProdutoRequest): Response<ProdutoDto>

    @PUT("api/restaurantes/{rid}/produtos/{pid}")
    suspend fun updateProduto(
        @Path("rid") restauranteId: String,
        @Path("pid") produtoId: String,
        @Body body: UpdateProdutoRequest
    ): Response<ProdutoDto>

    @DELETE("api/restaurantes/{rid}/produtos/{pid}")
    suspend fun deleteProduto(
        @Path("rid") restauranteId: String,
        @Path("pid") produtoId: String
    ): Response<MessageResponse>

    // ── PEDIDOS ───────────────────────────────────────────────
    @POST("api/pedidos")
    suspend fun criarPedido(@Body body: CriarPedidoRequest): Response<PedidoDto>

    @GET("api/pedidos/meus")
    suspend fun meusPedidos(): Response<List<PedidoDto>>

    @GET("api/pedidos/restaurante/{rid}")
    suspend fun pedidosRestaurante(@Path("rid") restauranteId: String): Response<List<PedidoDto>>

    @PUT("api/pedidos/{pid}/status")
    suspend fun atualizarStatus(@Path("pid") pedidoId: String, @Body body: AtualizarStatusRequest): Response<PedidoDto>

    @POST("api/pedidos/{pid}/avaliar")
    suspend fun avaliarPedido(@Path("pid") pedidoId: String, @Body body: AvaliarPedidoRequest): Response<MessageResponse>

    @GET("api/pedidos/disponiveis")
    suspend fun pedidosDisponiveis(): Response<List<PedidoDto>>

    @GET("api/pedidos/entregas")
    suspend fun minhasEntregas(): Response<List<PedidoDto>>

    @POST("api/pedidos/{pid}/validar-entrega")
    suspend fun validarEntrega(@Path("pid") pedidoId: String, @Body body: ValidarEntregaRequest): Response<MessageResponse>

    @POST("api/pedidos/{pid}/confirmar-recebimento")
    suspend fun confirmarRecebimento(@Path("pid") pedidoId: String): Response<MessageResponse>

    @POST("api/pedidos/{pid}/simular-passo")
    suspend fun simularPasso(@Path("pid") pedidoId: String): Response<PedidoDto>

    @GET("api/pedidos/{pid}/codigo-entrega")
    suspend fun codigoEntrega(@Path("pid") pedidoId: String): Response<CodigoEntregaResponse>

    // ── NOTIFICAÇÕES ──────────────────────────────────────────
    @GET("api/notificacoes/minhas")
    suspend fun minhasNotificacoes(): Response<List<NotificacaoDto>>

    @PUT("api/notificacoes/{nid}/lida")
    suspend fun marcarLida(@Path("nid") notificacaoId: String): Response<MessageResponse>

    @PUT("api/notificacoes/marcar-todas-lidas")
    suspend fun marcarTodasLidas(): Response<MessageResponse>

    // ── PAGAMENTOS ────────────────────────────────────────────
    @POST("api/pagamentos/mp/preferencia")
    suspend fun criarPreferencia(@Body body: PreferenciaRequest): Response<PreferenciaResponse>

    @GET("api/pagamentos/mp/pedido/{pid}/status")
    suspend fun statusPagamento(@Path("pid") pedidoId: String): Response<PagamentoStatusResponse>

    @POST("api/pagamentos/mp/sandbox/{pid}/confirmar")
    suspend fun confirmarPagamento(@Path("pid") pedidoId: String): Response<MessageResponse>

    // ── ENTREGADOR ────────────────────────────────────────────
    @POST("api/entregadores")
    suspend fun criarEntregador(@Body body: CriarEntregadorRequest): Response<EntregadorDto>

    @GET("api/entregadores/meu-perfil")
    suspend fun meuPerfilEntregador(): Response<EntregadorDto>

    @PUT("api/entregadores/{id}")
    suspend fun updateEntregador(@Path("id") id: String, @Body body: UpdateEntregadorRequest): Response<EntregadorDto>
}
