package com.kifome.app.ui.cliente

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.CriarPedidoRequest
import com.kifome.app.data.api.dto.ItemPedidoRequest
import com.kifome.app.data.api.dto.PedidoDto
import com.kifome.app.data.local.TokenDataStore
import com.kifome.app.data.repository.CartRepository
import com.kifome.app.data.repository.PagamentoRepository
import com.kifome.app.data.repository.PedidoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class MetodoPagamento(val label: String, val value: String) {
    PIX("PIX", "pix"),
    CARTAO("Cartão no App", "cartao"),
    DINHEIRO("Dinheiro na Entrega", "dinheiro"),
    MAQUININHA("Maquininha na Entrega", "maquininha")
}

enum class TipoEntrega(val label: String, val taxa: Double, val value: String) {
    PADRAO("Padrão (30-45 min)", 4.99, "padrao"),
    RAPIDA("Rápida (15-25 min)", 7.99, "rapida")
}

sealed class CarrinhoUiState {
    object Idle : CarrinhoUiState()
    object Loading : CarrinhoUiState()
    data class PedidoCriado(val pedido: PedidoDto) : CarrinhoUiState()
    data class PagamentoOnline(val pedido: PedidoDto, val initPoint: String) : CarrinhoUiState()
    data class Error(val message: String) : CarrinhoUiState()
}

@HiltViewModel
class CarrinhoViewModel @Inject constructor(
    val cartRepository: CartRepository,
    private val pedidoRepository: PedidoRepository,
    private val pagamentoRepository: PagamentoRepository,
    private val tokenDataStore: TokenDataStore
) : ViewModel() {

    private val _uiState = MutableStateFlow<CarrinhoUiState>(CarrinhoUiState.Idle)
    val uiState: StateFlow<CarrinhoUiState> = _uiState.asStateFlow()

    private val _metodoPagamento = MutableStateFlow(MetodoPagamento.DINHEIRO)
    val metodoPagamento: StateFlow<MetodoPagamento> = _metodoPagamento.asStateFlow()

    private val _tipoEntrega = MutableStateFlow(TipoEntrega.PADRAO)
    val tipoEntrega: StateFlow<TipoEntrega> = _tipoEntrega.asStateFlow()

    private val _observacoes = MutableStateFlow("")
    val observacoes: StateFlow<String> = _observacoes.asStateFlow()

    val items = cartRepository.itemsFlow

    fun setMetodoPagamento(metodo: MetodoPagamento) { _metodoPagamento.value = metodo }
    fun setTipoEntrega(tipo: TipoEntrega) { _tipoEntrega.value = tipo }
    fun setObservacoes(obs: String) { _observacoes.value = obs }

    fun removeItem(produtoId: String) = cartRepository.removeItem(produtoId)

    fun addItem(produtoId: String) {
        val item = cartRepository.itemsFlow.value.find { it.produto.id == produtoId } ?: return
        cartRepository.addItem(item.produto, cartRepository.restauranteId)
    }

    fun getSubtotal(): Double = cartRepository.getTotal()
    fun getTaxaEntrega(): Double = _tipoEntrega.value.taxa
    fun getTotal(): Double = getSubtotal() + getTaxaEntrega()

    fun finalizarPedido() {
        val currentItems = cartRepository.itemsFlow.value
        if (currentItems.isEmpty()) return
        viewModelScope.launch {
            _uiState.value = CarrinhoUiState.Loading
            val endereco = tokenDataStore.userEnderecoFlow.firstOrNull() ?: "Endereço não informado"
            val metodo = _metodoPagamento.value
            val tipo = _tipoEntrega.value

            val request = CriarPedidoRequest(
                restauranteId = cartRepository.restauranteId,
                itens = currentItems.map { cartItem ->
                    ItemPedidoRequest(
                        produtoId = cartItem.produto.id,
                        quantidade = cartItem.quantidade,
                        precoUnit = cartItem.produto.preco
                    )
                },
                enderecoEntrega = endereco,
                metodoPagamento = metodo.value,
                tipoEntrega = tipo.value,
                observacoes = _observacoes.value.ifBlank { null }
            )

            pedidoRepository.criar(request)
                .onSuccess { pedido ->
                    cartRepository.clear()
                    // Se pagamento online (PIX ou Cartão), criar preferência no Mercado Pago
                    if (metodo == MetodoPagamento.PIX || metodo == MetodoPagamento.CARTAO) {
                        pagamentoRepository.criarPreferencia(pedido.id)
                            .onSuccess { pref ->
                                _uiState.value = CarrinhoUiState.PagamentoOnline(pedido, pref.initPoint)
                            }
                            .onFailure {
                                // Fallback: ir direto para acompanhar
                                _uiState.value = CarrinhoUiState.PedidoCriado(pedido)
                            }
                    } else {
                        _uiState.value = CarrinhoUiState.PedidoCriado(pedido)
                    }
                }
                .onFailure {
                    _uiState.value = CarrinhoUiState.Error(it.message ?: "Erro ao criar pedido")
                }
        }
    }

    fun resetState() { _uiState.value = CarrinhoUiState.Idle }
}
