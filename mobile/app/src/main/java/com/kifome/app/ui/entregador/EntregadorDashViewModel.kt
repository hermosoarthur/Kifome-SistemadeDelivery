package com.kifome.app.ui.entregador

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.PedidoDto
import com.kifome.app.data.repository.EntregadorRepository
import com.kifome.app.data.repository.PedidoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EntregadorDashViewModel @Inject constructor(
    private val pedidoRepository: PedidoRepository,
    private val entregadorRepository: EntregadorRepository
) : ViewModel() {

    private val _pedidosDisponiveis = MutableStateFlow<List<PedidoDto>>(emptyList())
    val pedidosDisponiveis: StateFlow<List<PedidoDto>> = _pedidosDisponiveis.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _isLoading.value = true
            pedidoRepository.pedidosDisponiveis()
                .onSuccess { _pedidosDisponiveis.value = it; _isLoading.value = false }
                .onFailure { _message.value = it.message; _isLoading.value = false }
        }
    }

    fun aceitarPedido(pedidoId: String) {
        viewModelScope.launch {
            pedidoRepository.atualizarStatus(pedidoId, "saiu")
                .onSuccess { carregar(); _message.value = "Pedido aceito! Vá buscar no restaurante." }
                .onFailure { _message.value = it.message }
        }
    }

    fun clearMessage() { _message.value = null }
}

