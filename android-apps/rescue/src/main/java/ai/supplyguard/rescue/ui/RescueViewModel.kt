package ai.supplyguard.rescue.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ai.supplyguard.data.MeshEnvelope
import ai.supplyguard.rescue.RescueApp
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class RescueViewModel(app: Application) : AndroidViewModel(app) {
  private val rescueApp = app as RescueApp
  private val repo = rescueApp.repo

  val sos: StateFlow<List<MeshEnvelope>> =
    repo.watchSos().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

  fun sendResponse(targetMessageId: String, message: String) {
    viewModelScope.launch {
      runCatching {
        repo.createResponse(targetMessageId = targetMessageId, message = message)
      }
    }
  }
}

