package com.kifome.app.data.repository

import com.kifome.app.data.api.dto.ProdutoDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

data class CartItem(
    val produto: ProdutoDto,
    val quantidade: Int
)

@Singleton
class CartRepository @Inject constructor() {

    private val _items = MutableStateFlow<List<CartItem>>(emptyList())
    val itemsFlow: StateFlow<List<CartItem>> = _items.asStateFlow()

    var restauranteId: String = ""

    fun addItem(produto: ProdutoDto, restauranteIdParam: String) {
        if (restauranteIdParam != restauranteId && _items.value.isNotEmpty()) {
            // Different restaurant — clear cart first
            _items.value = emptyList()
        }
        restauranteId = restauranteIdParam
        val existing = _items.value.find { it.produto.id == produto.id }
        _items.value = if (existing != null) {
            _items.value.map { if (it.produto.id == produto.id) it.copy(quantidade = it.quantidade + 1) else it }
        } else {
            _items.value + CartItem(produto, 1)
        }
    }

    fun removeItem(produtoId: String) {
        val existing = _items.value.find { it.produto.id == produtoId }
        if (existing != null && existing.quantidade > 1) {
            _items.value = _items.value.map {
                if (it.produto.id == produtoId) it.copy(quantidade = it.quantidade - 1) else it
            }
        } else {
            _items.value = _items.value.filter { it.produto.id != produtoId }
        }
    }

    fun clear() {
        _items.value = emptyList()
        restauranteId = ""
    }

    fun getTotal(): Double = _items.value.sumOf { it.produto.preco * it.quantidade }
    fun getTotalItems(): Int = _items.value.sumOf { it.quantidade }
}

