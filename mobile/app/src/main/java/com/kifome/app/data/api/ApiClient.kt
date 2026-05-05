package com.kifome.app.data.api

import com.kifome.app.BuildConfig
import com.kifome.app.data.local.TokenDataStore
import com.kifome.app.di.AuthEventChannel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

const val BASE_URL = BuildConfig.API_BASE_URL
// Render.com free tier hiberna após inatividade e pode demorar ~60s para acordar
private const val TIMEOUT_SECONDS = 90L

class AuthInterceptor(
    private val tokenDataStore: TokenDataStore,
    private val authEventChannel: AuthEventChannel
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenDataStore.tokenFlow.firstOrNull() }

        val requestBuilder = chain.request().newBuilder()
        token?.let { requestBuilder.addHeader("Authorization", "Bearer $it") }

        val response = chain.proceed(requestBuilder.build())

        if (response.code == 401) {
            runBlocking { tokenDataStore.clearToken() }
            authEventChannel.channel.trySend(Unit)
        }

        return response
    }
}

object ApiClient {
    fun createRetrofit(tokenDataStore: TokenDataStore, authEventChannel: AuthEventChannel): Retrofit {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenDataStore, authEventChannel))
            .addInterceptor(loggingInterceptor)
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}
