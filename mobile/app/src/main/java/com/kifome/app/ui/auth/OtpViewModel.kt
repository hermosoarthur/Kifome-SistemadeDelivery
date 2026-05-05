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
class OtpViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _otpCode = MutableStateFlow("")
    val otpCode: StateFlow<String> = _otpCode.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _navigateHome = MutableStateFlow(false)
    val navigateHome: StateFlow<Boolean> = _navigateHome.asStateFlow()

    private val _navigateRegistro = MutableStateFlow(false)
    val navigateRegistro: StateFlow<Boolean> = _navigateRegistro.asStateFlow()

    fun updateOtp(code: String) {
        _otpCode.value = code.filter { it.isDigit() }.take(6)
    }

    fun verificar(metodo: String, contato: String, codigo: String) {
        if (codigo.length != 6) return

        viewModelScope.launch {
            _isLoading.value = true
            val result = if (metodo == "sms") {
                authRepository.verifyOtpSms(contato, codigo)
            } else {
                authRepository.verifyOtpEmail(contato, codigo)
            }
            _isLoading.value = false

            when (result) {
                is Resource.Success -> _navigateHome.value = true
                is Resource.Error -> {
                    val msg = result.message.lowercase()
                    if (msg.contains("não encontrado") || msg.contains("nao encontrado") || msg.contains("usuario")) {
                        _navigateRegistro.value = true
                    } else {
                        _error.value = result.message
                    }
                }
                is Resource.Loading -> Unit
            }
        }
    }

    fun clearError() {
        _error.value = null
    }

    fun consumeNavigateHome() {
        _navigateHome.value = false
    }

    fun consumeNavigateRegistro() {
        _navigateRegistro.value = false
    }
}

