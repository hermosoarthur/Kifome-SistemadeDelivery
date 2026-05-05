package com.kifome.app.ui.entregador

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.repository.PedidoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class ValidarEntregaUiState {
    object Idle : ValidarEntregaUiState()
    object Loading : ValidarEntregaUiState()
    object Success : ValidarEntregaUiState()
    data class Error(val message: String) : ValidarEntregaUiState()
}

@HiltViewModel
class ValidarEntregaViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val pedidoRepository: PedidoRepository
) : ViewModel() {

    private val pedidoId: String = checkNotNull(savedStateHandle["pedidoId"])

    private val _uiState = MutableStateFlow<ValidarEntregaUiState>(ValidarEntregaUiState.Idle)
    val uiState: StateFlow<ValidarEntregaUiState> = _uiState.asStateFlow()

    private val _codigoGerado = MutableStateFlow<String?>(null)
    val codigoGerado: StateFlow<String?> = _codigoGerado.asStateFlow()

    init { buscarCodigo() }

    private fun buscarCodigo() {
        viewModelScope.launch {
            pedidoRepository.codigoEntrega(pedidoId)
                .onSuccess { _codigoGerado.value = it }
                .onFailure { /* código pode não existir ainda */ }
        }
    }

    fun validar(codigo: String) {
        if (codigo.isBlank()) return
        viewModelScope.launch {
            _uiState.value = ValidarEntregaUiState.Loading
            pedidoRepository.validarEntrega(pedidoId, codigo)
                .onSuccess { _uiState.value = ValidarEntregaUiState.Success }
                .onFailure { _uiState.value = ValidarEntregaUiState.Error(it.message ?: "Código inválido") }
        }
    }
}

