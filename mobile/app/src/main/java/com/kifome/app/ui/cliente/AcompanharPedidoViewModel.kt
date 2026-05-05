package com.kifome.app.ui.cliente

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.PedidoDto
import com.kifome.app.data.repository.PedidoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AcompanharPedidoViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val pedidoRepository: PedidoRepository
) : ViewModel() {

    private val pedidoId: String = checkNotNull(savedStateHandle["pedidoId"])

    private val _pedido = MutableStateFlow<PedidoDto?>(null)
    val pedido: StateFlow<PedidoDto?> = _pedido.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _codigoEntrega = MutableStateFlow<String?>(null)
    val codigoEntrega: StateFlow<String?> = _codigoEntrega.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    private var pollingJob: Job? = null

    init { startPolling() }

    private fun startPolling() {
        pollingJob = viewModelScope.launch {
            while (isActive) {
                fetchPedido()
                // Buscar código de entrega quando pedido estiver saindo para entrega
                val status = _pedido.value?.status
                if ((status == "em_entrega" || status == "pronto") && _codigoEntrega.value == null) {
                    fetchCodigoEntrega()
                }
                if (status == "entregue" || status == "cancelado") break
                delay(15_000) // poll every 15 seconds como especificado
            }
        }
    }

    private suspend fun fetchPedido() {
        pedidoRepository.meusPedidos()
            .onSuccess { lista ->
                val p = lista.find { it.id == pedidoId }
                _pedido.value = p
                _isLoading.value = false
            }
            .onFailure {
                if (_pedido.value == null) {
                    _error.value = it.message
                }
                _isLoading.value = false
            }
    }

    private suspend fun fetchCodigoEntrega() {
        pedidoRepository.codigoEntrega(pedidoId)
            .onSuccess { codigo -> _codigoEntrega.value = codigo }
            .onFailure { /* silencioso — pode não estar disponível */ }
    }

    fun confirmarRecebimento() {
        viewModelScope.launch {
            pedidoRepository.confirmarRecebimento(pedidoId)
                .onSuccess {
                    _message.value = "Recebimento confirmado! Obrigado 🎉"
                    fetchPedido()
                }
                .onFailure { _message.value = it.message ?: "Erro ao confirmar recebimento" }
        }
    }

    fun avaliar(nota: Int, comentario: String) {
        viewModelScope.launch {
            pedidoRepository.avaliar(pedidoId, nota, comentario.ifBlank { null })
                .onSuccess { _message.value = "Avaliação enviada! Obrigado ⭐" }
                .onFailure { _message.value = "Erro ao enviar avaliação" }
        }
    }

    fun simularPasso() {
        viewModelScope.launch {
            pedidoRepository.simularPasso(pedidoId)
                .onSuccess { _pedido.value = it }
                .onFailure { _message.value = "Erro ao simular" }
        }
    }

    fun clearMessage() { _message.value = null }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
