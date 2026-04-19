package ai.supplyguard.net

import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

object BackendClient {
  fun create(baseUrl: String): BackendApi {
    val json = Json { ignoreUnknownKeys = true }
    val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
    val okHttp = OkHttpClient.Builder()
      .connectTimeout(10, TimeUnit.SECONDS)
      .readTimeout(20, TimeUnit.SECONDS)
      .writeTimeout(20, TimeUnit.SECONDS)
      .addInterceptor(logging)
      .build()

    val retrofit = Retrofit.Builder()
      .baseUrl(baseUrl)
      .client(okHttp)
      .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
      .build()

    return retrofit.create(BackendApi::class.java)
  }
}

