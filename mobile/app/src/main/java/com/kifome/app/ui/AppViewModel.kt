package com.kifome.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.repository.AuthRepository
import com.kifome.app.data.repository.CartRepository
import com.kifome.app.di.AuthEventChannel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class AppViewModel @Inject constructor(
    authEventChannel: AuthEventChannel,
    private val authRepository: AuthRepository,
    private val cartRepository: CartRepository
) : ViewModel() {
    val authEvents: Flow<Unit> = authEventChannel.channel.receiveAsFlow()

    fun logout(onDone: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            cartRepository.clear()
            onDone()
        }
    }
}

