package com.kifome.app.ui.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.kifome.app.core.util.Resource
import com.kifome.app.data.repository.phase1.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _selectedTab = MutableStateFlow(0)
    val selectedTab: StateFlow<Int> = _selectedTab.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _otpNavigation = MutableStateFlow<Pair<String, String>?>(null)
    val otpNavigation: StateFlow<Pair<String, String>?> = _otpNavigation.asStateFlow()

    private val _homeNavigation = MutableStateFlow(false)
    val homeNavigation: StateFlow<Boolean> = _homeNavigation.asStateFlow()

    fun selectTab(index: Int) {
        _selectedTab.value = index
    }

    fun requestOtp(contato: String, metodo: String) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = if (metodo == "sms") {
                authRepository.requestOtpSms(contato)
            } else {
                authRepository.requestOtpEmail(contato)
            }
            _isLoading.value = false

            when (result) {
                is Resource.Success -> _otpNavigation.value = metodo to contato
                is Resource.Error -> _error.value = result.message
                is Resource.Loading -> Unit
            }
        }
    }

    fun loginGoogle(activity: Activity) {
        viewModelScope.launch {
            _isLoading.value = true
            val account = GoogleSignIn.getLastSignedInAccount(activity)
            if (account == null) {
                _isLoading.value = false
                _error.value = "Faça login com Google e tente novamente."
                return@launch
            }
            val token = account.idToken
            if (token.isNullOrBlank()) {
                _isLoading.value = false
                _error.value = "Token do Google inválido."
                return@launch
            }

            val result = authRepository.loginGoogle(accessToken = token, idToken = token)
            _isLoading.value = false
            when (result) {
                is Resource.Success -> _homeNavigation.value = true
                is Resource.Error -> _error.value = result.message
                is Resource.Loading -> Unit
            }
        }
    }

    fun consumeOtpNavigation() {
        _otpNavigation.value = null
    }

    fun consumeHomeNavigation() {
        _homeNavigation.value = false
    }

    fun clearError() {
        _error.value = null
    }

    fun googleSignInOptions() =
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestIdToken("debug-client-id")
            .build()
}

