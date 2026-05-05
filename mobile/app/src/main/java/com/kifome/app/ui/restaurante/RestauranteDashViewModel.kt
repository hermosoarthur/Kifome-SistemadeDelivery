package com.kifome.app.ui.restaurante

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.PedidoDto
import com.kifome.app.data.api.dto.RestauranteDto
import com.kifome.app.data.repository.PedidoRepository
import com.kifome.app.data.repository.RestauranteRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class RestauranteDashUiState {
    object Loading : RestauranteDashUiState()
    data class Success(
        val restaurante: RestauranteDto,
        val pedidosHoje: List<PedidoDto>
    ) : RestauranteDashUiState()
    data class Error(val message: String) : RestauranteDashUiState()
}

@HiltViewModel
class RestauranteDashViewModel @Inject constructor(
    private val restauranteRepository: RestauranteRepository,
    private val pedidoRepository: PedidoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<RestauranteDashUiState>(RestauranteDashUiState.Loading)
    val uiState: StateFlow<RestauranteDashUiState> = _uiState.asStateFlow()

    private var restauranteId: String = ""

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = RestauranteDashUiState.Loading
            restauranteRepository.meuRestaurante()
                .onSuccess { restaurante ->
                    restauranteId = restaurante.id
                    pedidoRepository.pedidosRestaurante(restaurante.id)
                        .onSuccess { pedidos ->
                            _uiState.value = RestauranteDashUiState.Success(restaurante, pedidos)
                        }
                        .onFailure {
                            _uiState.value = RestauranteDashUiState.Success(restaurante, emptyList())
                        }
                }
                .onFailure { _uiState.value = RestauranteDashUiState.Error(it.message ?: "Erro ao carregar") }
        }
    }
}

