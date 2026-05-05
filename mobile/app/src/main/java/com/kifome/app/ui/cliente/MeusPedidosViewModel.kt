package com.kifome.app.ui.cliente

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.PedidoDto
import com.kifome.app.data.repository.PedidoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class MeusPedidosUiState {
    object Loading : MeusPedidosUiState()
    data class Success(val pedidos: List<PedidoDto>) : MeusPedidosUiState()
    data class Error(val message: String) : MeusPedidosUiState()
}

@HiltViewModel
class MeusPedidosViewModel @Inject constructor(
    private val pedidoRepository: PedidoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<MeusPedidosUiState>(MeusPedidosUiState.Loading)
    val uiState: StateFlow<MeusPedidosUiState> = _uiState.asStateFlow()

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = MeusPedidosUiState.Loading
            pedidoRepository.meusPedidos()
                .onSuccess { _uiState.value = MeusPedidosUiState.Success(it.sortedByDescending { p -> p.createdAt }) }
                .onFailure { _uiState.value = MeusPedidosUiState.Error(it.message ?: "Erro ao carregar pedidos") }
        }
    }
}

