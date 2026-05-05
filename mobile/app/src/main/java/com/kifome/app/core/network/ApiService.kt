package com.kifome.app.core.network

import com.kifome.app.data.dto.AuthResponse
import com.kifome.app.data.dto.EmailJsSendRequest
import com.kifome.app.data.dto.ListaRestaurantesResponse
import com.kifome.app.data.dto.LoginGoogleRequest
import com.kifome.app.data.dto.MeResponse
import com.kifome.app.data.dto.MessageResponse
import com.kifome.app.data.dto.RequestOtpEmailRequest
import com.kifome.app.data.dto.RequestOtpSmsRequest
import com.kifome.app.data.dto.VerifyOtpEmailRequest
import com.kifome.app.data.dto.VerifyOtpSmsRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Url
import okhttp3.ResponseBody

interface ApiService {
    @POST
    suspend fun sendEmailOtp(
        @Url url: String,
        @Body body: EmailJsSendRequest
    ): Response<ResponseBody>

    @POST("api/auth/request_otp_email")
    suspend fun requestOtpEmail(@Body body: RequestOtpEmailRequest): Response<MessageResponse>

    @POST("api/auth/verify_otp_email")
    suspend fun verifyOtpEmail(@Body body: VerifyOtpEmailRequest): Response<AuthResponse>

    @POST("api/auth/request_otp_sms")
    suspend fun requestOtpSms(@Body body: RequestOtpSmsRequest): Response<MessageResponse>

    @POST("api/auth/verify_otp_sms")
    suspend fun verifyOtpSms(@Body body: VerifyOtpSmsRequest): Response<AuthResponse>

    @POST("api/auth/login_google")
    suspend fun loginGoogle(@Body body: LoginGoogleRequest): Response<AuthResponse>

    @GET("api/auth/me")
    suspend fun me(): Response<MeResponse>

    @GET("api/restaurantes")
    suspend fun listarRestaurantes(
        @Query("busca") busca: String? = null,
        @Query("categoria") categoria: String? = null,
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): Response<ListaRestaurantesResponse>
}

