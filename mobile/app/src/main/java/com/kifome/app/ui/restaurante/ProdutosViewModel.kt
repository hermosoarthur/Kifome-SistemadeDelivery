package com.kifome.app.ui.restaurante

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.data.api.dto.CriarProdutoRequest
import com.kifome.app.data.api.dto.ProdutoDto
import com.kifome.app.data.api.dto.UpdateProdutoRequest
import com.kifome.app.data.repository.ProdutoRepository
import com.kifome.app.data.repository.RestauranteRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProdutosViewModel @Inject constructor(
    private val restauranteRepository: RestauranteRepository,
    private val produtoRepository: ProdutoRepository
) : ViewModel() {

    private val _produtos = MutableStateFlow<List<ProdutoDto>>(emptyList())
    val produtos: StateFlow<List<ProdutoDto>> = _produtos.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    private var restauranteId = ""

    init { carregar() }

    fun carregar() {
        viewModelScope.launch {
            _isLoading.value = true
            restauranteRepository.meuRestaurante()
                .onSuccess { r ->
                    restauranteId = r.id
                    produtoRepository.listar(r.id)
                        .onSuccess { _produtos.value = it; _isLoading.value = false }
                        .onFailure { _message.value = it.message; _isLoading.value = false }
                }
                .onFailure { _message.value = it.message; _isLoading.value = false }
        }
    }

    fun criar(nome: String, descricao: String, preco: Double, categoria: String) {
        viewModelScope.launch {
            produtoRepository.criar(
                restauranteId,
                CriarProdutoRequest(nome = nome, descricao = descricao.ifBlank { null }, preco = preco, categoria = categoria.ifBlank { null })
            ).onSuccess { carregar() }
             .onFailure { _message.value = it.message }
        }
    }

    fun toggleDisponivel(produto: ProdutoDto) {
        viewModelScope.launch {
            produtoRepository.atualizar(restauranteId, produto.id, UpdateProdutoRequest(disponivel = !produto.disponivel))
                .onSuccess { carregar() }
                .onFailure { _message.value = it.message }
        }
    }

    fun deletar(produtoId: String) {
        viewModelScope.launch {
            produtoRepository.deletar(restauranteId, produtoId)
                .onSuccess { carregar() }
                .onFailure { _message.value = it.message }
        }
    }

    fun clearMessage() { _message.value = null }
}

