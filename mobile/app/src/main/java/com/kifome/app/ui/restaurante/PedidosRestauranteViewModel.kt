package com.kifome.app.ui.restaurante

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.PedidoDto
import com.kifome.app.data.repository.PedidoRepository
import com.kifome.app.data.repository.RestauranteRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PedidosRestauranteViewModel @Inject constructor(
    private val restauranteRepository: RestauranteRepository,
    private val pedidoRepository: PedidoRepository
) : ViewModel() {

    private val _pedidos = MutableStateFlow<List<PedidoDto>>(emptyList())
    val pedidos: StateFlow<List<PedidoDto>> = _pedidos.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _filtroStatus = MutableStateFlow("todos")
    val filtroStatus: StateFlow<String> = _filtroStatus.asStateFlow()

    private var restauranteId = ""
    private var todosPedidos: List<PedidoDto> = emptyList()

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _isLoading.value = true
            restauranteRepository.meuRestaurante()
                .onSuccess { r ->
                    restauranteId = r.id
                    pedidoRepository.pedidosRestaurante(r.id)
                        .onSuccess { lista ->
                            todosPedidos = lista
                            aplicarFiltro()
                            _isLoading.value = false
                        }
                        .onFailure { _error.value = it.message; _isLoading.value = false }
                }
                .onFailure { _error.value = it.message; _isLoading.value = false }
        }
    }

    fun setFiltro(status: String) {
        _filtroStatus.value = status
        aplicarFiltro()
    }

    private fun aplicarFiltro() {
        _pedidos.value = if (_filtroStatus.value == "todos") todosPedidos
        else todosPedidos.filter { it.status == _filtroStatus.value }
    }

    fun atualizarStatus(pedidoId: String, novoStatus: String) {
        viewModelScope.launch {
            pedidoRepository.atualizarStatus(pedidoId, novoStatus)
                .onSuccess { carregar() }
                .onFailure { _error.value = it.message }
        }
    }
}

