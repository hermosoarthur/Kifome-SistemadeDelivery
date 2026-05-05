package com.kifome.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "kifome_prefs")

@Singleton
class TokenDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_TIPO_KEY = stringPreferencesKey("user_tipo")
        private val USER_ENDERECO_KEY = stringPreferencesKey("user_endereco")
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[TOKEN_KEY]
    }

    val userNameFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_NAME_KEY]
    }

    val userTipoFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_TIPO_KEY]
    }

    val userIdFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_ID_KEY]
    }

    val userEnderecoFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[USER_ENDERECO_KEY]
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
        }
    }

    suspend fun saveUserInfo(id: String, name: String, tipo: String) {
        context.dataStore.edit { prefs ->
            prefs[USER_ID_KEY] = id
            prefs[USER_NAME_KEY] = name
            prefs[USER_TIPO_KEY] = tipo
        }
    }

    suspend fun saveEndereco(endereco: String) {
        context.dataStore.edit { prefs ->
            prefs[USER_ENDERECO_KEY] = endereco
        }
    }

    suspend fun clearToken() {
        context.dataStore.edit { prefs ->
            prefs.remove(TOKEN_KEY)
            prefs.remove(USER_ID_KEY)
            prefs.remove(USER_NAME_KEY)
            prefs.remove(USER_TIPO_KEY)
            prefs.remove(USER_ENDERECO_KEY)
        }
    }
}
