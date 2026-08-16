package com.tracker.agent.data.remote

import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

data class PairDeviceRequest(
    val pairingCode: String,
    val deviceName: String,
    val type: String = "android"
)

data class PairDeviceResponse(
    val deviceId: String,
    val deviceToken: String
)

data class SessionTelemetryRequest(
    val appName: String,
    val windowTitle: String?,
    val startTime: String,
    val endTime: String,
    val durationSeconds: Int
)

data class ScreenTimeTelemetryRequest(
    val date: String,
    val totalMinutes: Int,
    val byAppBreakdownJson: Map<String, Int>
)

data class AlertTelemetryRequest(
    val type: String,
    val message: String
)

interface TelemetryApi {

    @POST("api/family/devices/pair")
    suspend fun pairDevice(
        @Body request: PairDeviceRequest
    ): Response<PairDeviceResponse>

    @POST("api/telemetry/sessions")
    suspend fun sendSession(
        @Header("Authorization") authHeader: String,
        @Body request: SessionTelemetryRequest
    ): Response<Unit>

    @POST("api/telemetry/screentime")
    suspend fun sendDailyScreenTime(
        @Header("Authorization") authHeader: String,
        @Body request: ScreenTimeTelemetryRequest
    ): Response<Unit>

    @POST("api/telemetry/alerts")
    suspend fun sendAlert(
        @Header("Authorization") authHeader: String,
        @Body request: AlertTelemetryRequest
    ): Response<Unit>
}

object NetworkClient {
    private var apiInstance: TelemetryApi? = null
    private var currentBaseUrl: String = "http://10.0.2.2:3000/"

    fun getApi(baseUrl: String): TelemetryApi {
        val formattedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        if (apiInstance == null || currentBaseUrl != formattedUrl) {
            currentBaseUrl = formattedUrl
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }

            val okHttpClient = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build()

            apiInstance = Retrofit.Builder()
                .baseUrl(formattedUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(TelemetryApi::class.java)
        }
        return apiInstance!!
    }
}
