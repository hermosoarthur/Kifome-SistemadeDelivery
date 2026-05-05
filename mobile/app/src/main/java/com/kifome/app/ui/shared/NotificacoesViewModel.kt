package com.kifome.app.ui.shared

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.NotificacaoDto
import com.kifome.app.data.repository.NotificacaoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class NotificacoesUiState {
    object Loading : NotificacoesUiState()
    data class Success(val notificacoes: List<NotificacaoDto>) : NotificacoesUiState()
    data class Error(val message: String) : NotificacoesUiState()
}

@HiltViewModel
class NotificacoesViewModel @Inject constructor(
    private val notificacaoRepository: NotificacaoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<NotificacoesUiState>(NotificacoesUiState.Loading)
    val uiState: StateFlow<NotificacoesUiState> = _uiState.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = NotificacoesUiState.Loading
            val result: Result<List<NotificacaoDto>> = notificacaoRepository.minhas()
            result
                .onSuccess { lista -> _uiState.value = NotificacoesUiState.Success(lista) }
                .onFailure { err -> _uiState.value = NotificacoesUiState.Error(err.message ?: "Erro ao carregar notificações") }
        }
    }

    fun marcarLida(notification: NotificacaoDto) {
        if (notification.lida) return
        viewModelScope.launch {
            val result: Result<String> = notificacaoRepository.marcarLida(notification.id)
            result.onSuccess {
                val state = _uiState.value
                if (state is NotificacoesUiState.Success) {
                    _uiState.value = NotificacoesUiState.Success(
                        state.notificacoes.map {
                            if (it.id == notification.id) it.copy(lida = true) else it
                        }
                    )
                }
            }
        }
    }

    fun marcarTodasLidas() {
        viewModelScope.launch {
            val result: Result<String> = notificacaoRepository.marcarTodasLidas()
            result
                .onSuccess {
                    val state = _uiState.value
                    if (state is NotificacoesUiState.Success) {
                        _uiState.value = NotificacoesUiState.Success(
                            state.notificacoes.map { it.copy(lida = true) }
                        )
                    }
                    _message.value = "Todas as notificações marcadas como lidas"
                }
                .onFailure { err -> _message.value = err.message ?: "Erro" }
        }
    }

    fun clearMessage() { _message.value = null }
}
