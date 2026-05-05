package com.kifome.app.ui.restaurante

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.RestauranteDto
import com.kifome.app.data.api.dto.UpdateRestauranteRequest
import com.kifome.app.data.repository.RestauranteRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class MeuRestauranteUiState {
    object Loading : MeuRestauranteUiState()
    data class Success(val restaurante: RestauranteDto) : MeuRestauranteUiState()
    data class Error(val message: String) : MeuRestauranteUiState()
}

@HiltViewModel
class MeuRestauranteViewModel @Inject constructor(
    private val restauranteRepository: RestauranteRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<MeuRestauranteUiState>(MeuRestauranteUiState.Loading)
    val uiState: StateFlow<MeuRestauranteUiState> = _uiState.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    private var restauranteId = ""

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = MeuRestauranteUiState.Loading
            restauranteRepository.meuRestaurante()
                .onSuccess { _uiState.value = MeuRestauranteUiState.Success(it); restauranteId = it.id }
                .onFailure { _uiState.value = MeuRestauranteUiState.Error(it.message ?: "Erro ao carregar") }
        }
    }

    fun atualizar(nome: String, descricao: String, categoria: String, status: String) {
        viewModelScope.launch {
            restauranteRepository.atualizar(
                restauranteId,
                UpdateRestauranteRequest(
                    nomeFantasia = nome.ifBlank { null },
                    descricao = descricao.ifBlank { null },
                    categoria = categoria.ifBlank { null },
                    status = status.ifBlank { null }
                )
            ).onSuccess {
                _message.value = "Restaurante atualizado com sucesso!"
                carregar()
            }.onFailure { _message.value = it.message }
        }
    }

    fun clearMessage() { _message.value = null }
}

