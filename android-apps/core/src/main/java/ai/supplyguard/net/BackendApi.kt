package ai.supplyguard.net

import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.POST

@Serializable
data class ApiMessageDto(
  val id: String,
  val type: String,
  val payload: String,
  val timestampEpochMs: Long,
  val originDeviceId: String,
  val hops: Int,
)

interface BackendApi {
  @POST("/api/messages")
  suspend fun postMessages(@Body messages: List<ApiMessageDto>)
}

