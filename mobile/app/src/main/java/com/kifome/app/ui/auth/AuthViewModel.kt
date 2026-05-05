package com.kifome.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.repository.AuthRepository
import com.kifome.app.data.api.dto.MessageResponse
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class OtpSent(val contact: String, val isSms: Boolean = false, val codigoDev: String? = null) : AuthUiState()
    data class Success(val userName: String, val userTipo: String) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun requestOtp(email: String) {
        if (email.isBlank()) {
            _uiState.value = AuthUiState.Error("Por favor, informe seu e-mail.")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.requestOtp(email)
                .onSuccess { _uiState.value = AuthUiState.OtpSent(email, isSms = false, codigoDev = it.codigoDev) }
                .onFailure { _uiState.value = AuthUiState.Error(it.message ?: "Erro ao enviar código.") }
        }
    }

    fun requestOtpSms(telefone: String) {
        if (telefone.isBlank()) {
            _uiState.value = AuthUiState.Error("Por favor, informe seu telefone.")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.requestOtpSms(telefone)
                .onSuccess { _uiState.value = AuthUiState.OtpSent(telefone, isSms = true) }
                .onFailure { _uiState.value = AuthUiState.Error(it.message ?: "Erro ao enviar SMS.") }
        }
    }

    fun verifyOtp(contact: String, codigo: String, isSms: Boolean = false) {
        if (codigo.length != 6) {
            _uiState.value = AuthUiState.Error("O código deve ter 6 dígitos.")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            val result = if (isSms) {
                authRepository.verifyOtpSms(contact, codigo)
            } else {
                authRepository.verifyOtp(contact, codigo)
            }
            result
                .onSuccess { _uiState.value = AuthUiState.Success(it.usuario.nome, it.usuario.tipo) }
                .onFailure { _uiState.value = AuthUiState.Error(it.message ?: "Código inválido.") }
        }
    }

    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }
}
