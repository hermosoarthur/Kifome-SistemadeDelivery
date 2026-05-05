package com.kifome.app.di

import com.kifome.app.data.api.ApiClient
import com.kifome.app.data.api.KifomeApi
import com.kifome.app.data.local.TokenDataStore
import com.kifome.app.di.AuthEventChannel
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideRetrofit(
        tokenDataStore: TokenDataStore,
        authEventChannel: AuthEventChannel
    ): Retrofit = ApiClient.createRetrofit(tokenDataStore, authEventChannel)

    @Provides
    @Singleton
    fun provideKifomeApi(retrofit: Retrofit): KifomeApi =
        retrofit.create(KifomeApi::class.java)
}
