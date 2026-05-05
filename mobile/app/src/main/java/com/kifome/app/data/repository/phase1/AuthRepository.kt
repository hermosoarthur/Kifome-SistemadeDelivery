package com.kifome.app.data.repository.phase1

import com.kifome.app.core.util.Resource
import com.kifome.app.domain.model.Usuario

interface AuthRepository {
    suspend fun requestOtpEmail(email: String): Resource<Unit>
    suspend fun requestOtpSms(telefone: String): Resource<Unit>
    suspend fun verifyOtpEmail(
        email: String,
        codigo: String,
        nome: String? = null,
        tipo: String? = null,
        telefone: String? = null
    ): Resource<Usuario>

    suspend fun verifyOtpSms(
        telefone: String,
        codigo: String,
        nome: String? = null,
        tipo: String? = null
    ): Resource<Usuario>

    suspend fun loginGoogle(accessToken: String, idToken: String): Resource<Usuario>
    suspend fun me(): Resource<Usuario>
}

