package com.kifome.app.core.datastore

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import com.google.gson.Gson
import com.kifome.app.domain.model.EnderecoSelecionado
import com.kifome.app.domain.model.Usuario
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserPreferences @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        val PREF_TOKEN = stringPreferencesKey("kifome_token")
        val PREF_USER_ID = intPreferencesKey("kifome_user_id")
        val PREF_USER_NOME = stringPreferencesKey("kifome_user_nome")
        val PREF_USER_TIPO = stringPreferencesKey("kifome_user_tipo")
        val PREF_USER_ENDERECO = stringPreferencesKey("kifome_user_endereco")
    }

    private val gson = Gson()

    fun getToken(): Flow<String?> = dataStore.data.map { it[PREF_TOKEN] }

    suspend fun saveToken(token: String) {
        dataStore.edit { it[PREF_TOKEN] = token }
    }

    suspend fun saveUser(usuario: Usuario) {
        dataStore.edit {
            it[PREF_USER_ID] = usuario.id
            it[PREF_USER_NOME] = usuario.nome
            it[PREF_USER_TIPO] = usuario.tipo
        }
    }

    fun getUsuario(): Flow<Usuario?> = dataStore.data.map { prefs ->
        val id = prefs[PREF_USER_ID] ?: return@map null
        val nome = prefs[PREF_USER_NOME] ?: return@map null
        val tipo = prefs[PREF_USER_TIPO] ?: return@map null
        Usuario(id = id, nome = nome, email = null, tipo = tipo, telefone = null)
    }

    suspend fun saveEndereco(endereco: EnderecoSelecionado) {
        dataStore.edit { it[PREF_USER_ENDERECO] = gson.toJson(endereco) }
    }

    fun getEndereco(): Flow<EnderecoSelecionado?> = dataStore.data.map { prefs ->
        prefs[PREF_USER_ENDERECO]?.let { json ->
            runCatching { gson.fromJson(json, EnderecoSelecionado::class.java) }.getOrNull()
        }
    }

    suspend fun clearAll() {
        dataStore.edit { it.clear() }
    }

    suspend fun getTokenValue(): String? = getToken().firstOrNull()
}

