package ai.supplyguard.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MeshMessageDao {
  @Insert(onConflict = OnConflictStrategy.IGNORE)
  suspend fun insertIgnore(entity: MeshMessageEntity): Long

  @Query("SELECT * FROM mesh_messages WHERE type = :type ORDER BY timestampEpochMs DESC")
  fun watchByType(type: String): Flow<List<MeshMessageEntity>>

  @Query("SELECT * FROM mesh_messages ORDER BY timestampEpochMs DESC")
  fun watchAll(): Flow<List<MeshMessageEntity>>

  @Query("SELECT id FROM mesh_messages")
  suspend fun loadAllIds(): List<String>

  @Query("SELECT * FROM mesh_messages WHERE lastForwardAttemptEpochMs IS NULL OR lastForwardAttemptEpochMs < :olderThanEpochMs")
  suspend fun loadForwardCandidates(olderThanEpochMs: Long): List<MeshMessageEntity>

  @Query("UPDATE mesh_messages SET lastForwardAttemptEpochMs = :epochMs WHERE id IN (:ids)")
  suspend fun markForwardAttempt(ids: List<String>, epochMs: Long)

  @Query("UPDATE mesh_messages SET syncState = :state WHERE id IN (:ids)")
  suspend fun setSyncState(ids: List<String>, state: MessageSyncState)

  @Query("SELECT * FROM mesh_messages WHERE syncState = :state ORDER BY timestampEpochMs ASC LIMIT :limit")
  suspend fun loadBySyncState(state: MessageSyncState, limit: Int): List<MeshMessageEntity>
}

