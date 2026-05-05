package com.kifome.app.ui.shared

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.UsuarioDto
import com.kifome.app.data.local.TokenDataStore
import com.kifome.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class PerfilUiState {
    object Loading : PerfilUiState()
    data class Success(val usuario: UsuarioDto) : PerfilUiState()
    data class Error(val message: String) : PerfilUiState()
}

@HiltViewModel
class PerfilViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val tokenDataStore: TokenDataStore
) : ViewModel() {

    private val _uiState = MutableStateFlow<PerfilUiState>(PerfilUiState.Loading)
    val uiState: StateFlow<PerfilUiState> = _uiState.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    private var usuarioId = ""

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = PerfilUiState.Loading
            authRepository.getMe()
                .onSuccess { u -> _uiState.value = PerfilUiState.Success(u); usuarioId = u.id }
                .onFailure { _uiState.value = PerfilUiState.Error(it.message ?: "Erro ao carregar perfil") }
        }
    }

    fun atualizarPerfil(nome: String, telefone: String) {
        viewModelScope.launch {
            authRepository.updatePerfil(usuarioId, nome, telefone)
                .onSuccess { _message.value = "Perfil atualizado!"; carregar() }
                .onFailure { _message.value = it.message }
        }
    }

    fun atualizarEndereco(endereco: String) {
        viewModelScope.launch {
            authRepository.updateEndereco(usuarioId, endereco)
                .onSuccess { _message.value = "Endereço atualizado!" }
                .onFailure { _message.value = it.message }
        }
    }

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onDone()
        }
    }

    fun clearMessage() { _message.value = null }
}

