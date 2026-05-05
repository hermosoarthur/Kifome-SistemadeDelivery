package com.kifome.app.core.auth

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OtpSessionStore @Inject constructor() {

    private data class OtpSession(
        val code: String,
        val expiresAtMillis: Long,
        val attempts: Int = 0
    )

    private val sessions = mutableMapOf<String, OtpSession>()

    fun save(email: String, code: String, ttlMillis: Long = 5 * 60 * 1000L) {
        sessions[email.lowercase().trim()] = OtpSession(
            code = code,
            expiresAtMillis = System.currentTimeMillis() + ttlMillis
        )
    }

    fun verify(email: String, code: String): Boolean {
        val key = email.lowercase().trim()
        val current = sessions[key] ?: return false

        if (System.currentTimeMillis() > current.expiresAtMillis) {
            sessions.remove(key)
            return false
        }

        if (current.code != code) {
            sessions[key] = current.copy(attempts = current.attempts + 1)
            return false
        }

        sessions.remove(key)
        return true
    }
}

