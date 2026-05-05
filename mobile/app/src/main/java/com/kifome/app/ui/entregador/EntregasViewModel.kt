package com.kifome.app.ui.entregador

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

@HiltViewModel
class EntregasViewModel @Inject constructor(
    private val pedidoRepository: PedidoRepository
) : ViewModel() {

    private val _entregas = MutableStateFlow<List<PedidoDto>>(emptyList())
    val entregas: StateFlow<List<PedidoDto>> = _entregas.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _isLoading.value = true
            pedidoRepository.minhasEntregas()
                .onSuccess { _entregas.value = it; _isLoading.value = false }
                .onFailure { _message.value = it.message; _isLoading.value = false }
        }
    }

    fun clearMessage() { _message.value = null }
}

