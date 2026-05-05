package com.kifome.app.ui.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.local.TokenDataStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SplashDestination {
    object Checking : SplashDestination()
    object Login : SplashDestination()
    data class Home(val tipo: String) : SplashDestination()
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val tokenDataStore: TokenDataStore
) : ViewModel() {

    private val _destination = MutableStateFlow<SplashDestination>(SplashDestination.Checking)
    val destination: StateFlow<SplashDestination> = _destination.asStateFlow()

    val isLoggedIn: StateFlow<Boolean> = tokenDataStore.tokenFlow
        .map { token -> token?.isNotBlank() == true }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = false
        )

    init {
        viewModelScope.launch {
            combine(tokenDataStore.tokenFlow, tokenDataStore.userTipoFlow) { token, tipo ->
                Pair(token, tipo)
            }.collect { (token, tipo) ->
                _destination.value = if (!token.isNullOrBlank()) {
                    SplashDestination.Home(tipo ?: "cliente")
                } else {
                    SplashDestination.Login
                }
            }
        }
    }
}
