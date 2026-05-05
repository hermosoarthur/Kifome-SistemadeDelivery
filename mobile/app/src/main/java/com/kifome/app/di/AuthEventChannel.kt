package com.kifome.app.di

import kotlinx.coroutines.channels.Channel
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthEventChannel @Inject constructor() {
    val channel = Channel<Unit>(Channel.CONFLATED)
}

