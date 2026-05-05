package com.kifome.app.data.repository.phase1

import com.kifome.app.core.util.Resource
import com.kifome.app.domain.model.Restaurante

interface RestauranteRepository {
    suspend fun listarRestaurantes(
        busca: String? = null,
        categoria: String? = null,
        page: Int = 1,
        perPage: Int = 20
    ): Resource<List<Restaurante>>
}

