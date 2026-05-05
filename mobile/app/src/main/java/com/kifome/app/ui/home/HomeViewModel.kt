package com.kifome.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kifome.app.core.datastore.UserPreferences
import com.kifome.app.core.util.Resource
import com.kifome.app.data.repository.phase1.RestauranteRepository
import com.kifome.app.domain.model.Restaurante
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val restauranteRepository: RestauranteRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _restaurantes = MutableStateFlow<Resource<List<Restaurante>>>(Resource.Loading())
    val restaurantes: StateFlow<Resource<List<Restaurante>>> = _restaurantes.asStateFlow()

    private val _categoriaAtiva = MutableStateFlow("")
    val categoriaAtiva: StateFlow<String> = _categoriaAtiva.asStateFlow()

    private val _busca = MutableStateFlow("")
    val busca: StateFlow<String> = _busca.asStateFlow()

    private val _nomeUsuario = MutableStateFlow("Cliente")
    val nomeUsuario: StateFlow<String> = _nomeUsuario.asStateFlow()

    private val _enderecoAtual = MutableStateFlow("Toque para definir")
    val enderecoAtual: StateFlow<String> = _enderecoAtual.asStateFlow()

    init {
        viewModelScope.launch {
            userPreferences.getUsuario().collect { user ->
                _nomeUsuario.value = user?.nome ?: "Cliente"
            }
        }

        viewModelScope.launch {
            userPreferences.getEndereco().collect { endereco ->
                _enderecoAtual.value = endereco?.enderecoCompleto ?: "Toque para definir"
            }
        }

        viewModelScope.launch {
            combine(_busca.debounce(400), _categoriaAtiva) { busca, cat ->
                busca to cat
            }.collect { (busca, categoria) ->
                carregarRestaurantes(busca = busca, categoria = categoria)
            }
        }
    }

    private suspend fun carregarRestaurantes(busca: String, categoria: String) {
        _restaurantes.value = Resource.Loading()
        val result = restauranteRepository.listarRestaurantes(
            busca = busca.ifBlank { null },
            categoria = categoria.ifBlank { null }
        )
        _restaurantes.value = result
    }

    fun selecionarCategoria(cat: String) {
        _categoriaAtiva.value = if (_categoriaAtiva.value == cat) "" else cat
    }

    fun buscar(query: String) {
        _busca.value = query
    }

    fun refresh() {
        viewModelScope.launch {
            carregarRestaurantes(_busca.value, _categoriaAtiva.value)
        }
    }
}
