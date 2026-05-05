package com.kifome.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.core.util.Resource
import com.kifome.app.data.repository.phase1.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RegistroViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _navigateHome = MutableStateFlow(false)
    val navigateHome: StateFlow<Boolean> = _navigateHome.asStateFlow()

    fun criarConta(
        metodo: String,
        contato: String,
        codigo: String,
        nome: String,
        tipo: String,
        telefone: String?
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = if (metodo == "sms") {
                authRepository.verifyOtpSms(contato, codigo, nome = nome, tipo = tipo)
            } else {
                authRepository.verifyOtpEmail(contato, codigo, nome = nome, tipo = tipo, telefone = telefone)
            }
            _isLoading.value = false
            when (result) {
                is Resource.Success -> _navigateHome.value = true
                is Resource.Error -> _error.value = result.message
                is Resource.Loading -> Unit
            }
        }
    }

    fun consumeNavigateHome() {
        _navigateHome.value = false
    }

    fun clearError() {
        _error.value = null
    }
}

