package com.kifome.app.di

import com.kifome.app.data.repository.phase1.AuthRepository
import com.kifome.app.data.repository.phase1.AuthRepositoryImpl
import com.kifome.app.data.repository.phase1.RestauranteRepository
import com.kifome.app.data.repository.phase1.RestauranteRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class Phase1RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindRestauranteRepository(impl: RestauranteRepositoryImpl): RestauranteRepository
}

