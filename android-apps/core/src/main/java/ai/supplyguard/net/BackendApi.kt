package ai.supplyguard.net

import kotlinx.serialization.Serializable
import retrofit2.http.GET
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query

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

  @GET("/api/messages")
  suspend fun getMessages(
    @Query("type") type: String? = null,
    @Query("sinceEpochMs") sinceEpochMs: Long? = null,
    @Query("limit") limit: Int = 50,
  ): List<ApiMessageDto>
}
