package com.kifome.app.data.repository.phase1

import com.google.gson.Gson
import com.kifome.app.BuildConfig
import com.kifome.app.core.auth.OtpSessionStore
import com.kifome.app.core.datastore.UserPreferences
import com.kifome.app.core.network.ApiService
import com.kifome.app.core.util.Resource
import com.kifome.app.data.dto.EmailJsSendRequest
import com.kifome.app.data.dto.ErrorResponse
import com.kifome.app.data.dto.LoginGoogleRequest
import com.kifome.app.data.dto.RequestOtpSmsRequest
import com.kifome.app.data.dto.UsuarioDto
import com.kifome.app.data.dto.VerifyOtpSmsRequest
import com.kifome.app.domain.model.Usuario
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException
import kotlin.random.Random
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: ApiService,
    private val prefs: UserPreferences,
    private val otpSessionStore: OtpSessionStore
) : AuthRepository {

    override suspend fun requestOtpEmail(email: String): Resource<Unit> = withContext(Dispatchers.IO) {
        val serviceId = BuildConfig.EMAILJS_SERVICE_ID
        val templateId = BuildConfig.EMAILJS_TEMPLATE_ID
        val publicKey = BuildConfig.EMAILJS_PUBLIC_KEY

        if (serviceId.isBlank() || templateId.isBlank() || publicKey.isBlank()) {
            return@withContext Resource.Error(
                "EmailJS não configurado. Defina EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID e EMAILJS_PUBLIC_KEY."
            )
        }

        val otp = Random.nextInt(100000, 999999).toString()
        otpSessionStore.save(email = email, code = otp)

        val body = EmailJsSendRequest(
            service_id = serviceId,
            template_id = templateId,
            user_id = publicKey,
            template_params = mapOf(
                "to_email" to email,
                "verification_code" to otp,
                "app_name" to "Kifome",
                "from_name" to "Kifome",
                "expires_in" to "5 minutos"
            )
        )

        return@withContext try {
            val response = api.sendEmailOtp("https://api.emailjs.com/api/v1.0/email/send", body)
            if (response.isSuccessful) {
                Resource.Success(Unit)
            } else {
                val raw = response.errorBody()?.string().orEmpty()
                val detail = extractErrorMessage(raw)
                val msg = when (response.code()) {
                    412 -> "EmailJS recusou a requisicao (412). Verifique service/template/public key e configuracao do template. Detalhe: ${detail.ifBlank { "sem detalhe" }}"
                    401, 403 -> "Falha de autenticacao no EmailJS. Confira EMAILJS_PUBLIC_KEY e permissoes do template."
                    else -> "Falha ao enviar codigo por e-mail (${response.code()}). ${detail.ifBlank { "" }}".trim()
                }
                Resource.Error(msg)
            }
        } catch (io: IOException) {
            val detail = io.localizedMessage?.takeIf { it.isNotBlank() } ?: "falha de rede"
            Resource.Error("Falha de rede ao enviar OTP: $detail")
        } catch (http: HttpException) {
            Resource.Error("Erro de comunicacao com EmailJS (${http.code()}).")
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Erro desconhecido ao enviar OTP")
        }
    }

    override suspend fun requestOtpSms(telefone: String): Resource<Unit> = withContext(Dispatchers.IO) {
        safeRequest {
            api.requestOtpSms(RequestOtpSmsRequest(telefone))
        }.mapUnit()
    }

    override suspend fun verifyOtpEmail(
        email: String,
        codigo: String,
        nome: String?,
        tipo: String?,
        telefone: String?
    ): Resource<Usuario> = withContext(Dispatchers.IO) {
        val verified = otpSessionStore.verify(email = email, code = codigo)
        if (!verified) {
            return@withContext Resource.Error("Código inválido ou expirado.")
        }

        val resolvedName = nome?.takeIf { it.isNotBlank() } ?: email.substringBefore("@")
        val resolvedType = tipo?.takeIf { it.isNotBlank() } ?: "cliente"
        val user = Usuario(
            id = kotlin.math.abs(email.hashCode()),
            nome = resolvedName,
            email = email,
            tipo = resolvedType,
            telefone = telefone
        )

        prefs.saveToken("emailjs_local_${System.currentTimeMillis()}")
        prefs.saveUser(user)
        Resource.Success(user)
    }

    override suspend fun verifyOtpSms(
        telefone: String,
        codigo: String,
        nome: String?,
        tipo: String?
    ): Resource<Usuario> = withContext(Dispatchers.IO) {
        when (val response = safeRequest {
            api.verifyOtpSms(
                VerifyOtpSmsRequest(
                    telefone = telefone,
                    codigo = codigo,
                    nome = nome,
                    tipo = tipo
                )
            )
        }) {
            is Resource.Success -> {
                prefs.saveToken(response.data.token)
                val user = response.data.usuario.toDomain()
                prefs.saveUser(user)
                Resource.Success(user)
            }
            is Resource.Error -> Resource.Error(response.message)
            is Resource.Loading -> Resource.Loading()
        }
    }

    override suspend fun loginGoogle(accessToken: String, idToken: String): Resource<Usuario> =
        withContext(Dispatchers.IO) {
            when (val response = safeRequest {
                api.loginGoogle(LoginGoogleRequest(access_token = accessToken, id_token = idToken))
            }) {
                is Resource.Success -> {
                    prefs.saveToken(response.data.token)
                    val user = response.data.usuario.toDomain()
                    prefs.saveUser(user)
                    Resource.Success(user)
                }
                is Resource.Error -> Resource.Error(response.message)
                is Resource.Loading -> Resource.Loading()
            }
        }

    override suspend fun me(): Resource<Usuario> = withContext(Dispatchers.IO) {
        val user = prefs.getUsuario().firstOrNull()
        if (user != null) Resource.Success(user) else Resource.Error("Usuário não encontrado no dispositivo")
    }

    private suspend fun <T> safeRequest(block: suspend () -> Response<T>): Resource<T> {
        return try {
            val response = block()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Resource.Success(body)
                } else {
                    Resource.Error("Resposta vazia do servidor")
                }
            } else {
                val raw = response.errorBody()?.string()
                val parsed = runCatching { Gson().fromJson(raw, ErrorResponse::class.java) }.getOrNull()
                Resource.Error(parsed?.erro ?: "Erro HTTP ${response.code()}")
            }
        } catch (io: IOException) {
            val detail = io.localizedMessage?.takeIf { it.isNotBlank() } ?: "falha de rede"
            Resource.Error("Falha de rede: $detail")
        } catch (http: HttpException) {
            Resource.Error("Erro no servidor (${http.code()}).")
        } catch (e: Exception) {
            Resource.Error(e.message ?: "Erro desconhecido")
        }
    }

    private fun UsuarioDto.toDomain(): Usuario =
        Usuario(id = id, nome = nome, email = email, tipo = tipo, telefone = telefone)

    private fun extractErrorMessage(raw: String): String {
        if (raw.isBlank()) return ""
        val parsed = runCatching { Gson().fromJson(raw, Map::class.java) }.getOrNull()
        val message = parsed?.get("message")?.toString()
        val text = parsed?.get("text")?.toString()
        val erro = parsed?.get("erro")?.toString()
        return message ?: text ?: erro ?: raw.take(220)
    }

    private fun <T> Resource<T>.mapUnit(): Resource<Unit> = when (this) {
        is Resource.Success -> Resource.Success(Unit)
        is Resource.Error -> Resource.Error(message)
        is Resource.Loading -> Resource.Loading()
    }
}

