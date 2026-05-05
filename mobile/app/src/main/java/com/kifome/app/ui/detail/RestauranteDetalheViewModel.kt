package com.kifome.app.ui.detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.ProdutoDto
import com.kifome.app.data.api.dto.RestauranteDto
import com.kifome.app.data.repository.CartRepository
import com.kifome.app.data.repository.ProdutoRepository
import com.kifome.app.data.repository.RestauranteRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DetalheUiState {
    object Loading : DetalheUiState()
    data class Success(val restaurante: RestauranteDto, val produtos: List<ProdutoDto>) : DetalheUiState()
    data class Error(val message: String) : DetalheUiState()
}

@HiltViewModel
class RestauranteDetalheViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val restauranteRepository: RestauranteRepository,
    private val produtoRepository: ProdutoRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val restauranteId: String = checkNotNull(savedStateHandle["restauranteId"])

    private val _uiState = MutableStateFlow<DetalheUiState>(DetalheUiState.Loading)
    val uiState: StateFlow<DetalheUiState> = _uiState.asStateFlow()

    val cartItems = cartRepository.itemsFlow

    init {
        carregar()
    }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = DetalheUiState.Loading
            val restauranteResult = restauranteRepository.obter(restauranteId)
            val produtosResult = produtoRepository.listar(restauranteId)

            if (restauranteResult.isSuccess && produtosResult.isSuccess) {
                _uiState.value = DetalheUiState.Success(
                    restaurante = restauranteResult.getOrThrow(),
                    produtos = produtosResult.getOrDefault(emptyList()).filter { it.disponivel }
                )
            } else {
                _uiState.value = DetalheUiState.Error(
                    restauranteResult.exceptionOrNull()?.message ?: "Erro ao carregar"
                )
            }
        }
    }

    fun addToCart(produto: ProdutoDto) {
        cartRepository.addItem(produto, restauranteId)
    }
}

