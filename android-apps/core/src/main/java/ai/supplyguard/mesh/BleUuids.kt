package ai.supplyguard.mesh

import java.util.UUID

object BleUuids {
  // Fixed UUIDs so different builds interoperate.
  val SERVICE_UUID: UUID = UUID.fromString("c9a9f1c4-4c30-4d8c-8a3d-2e3d3d6e4b10")
  val MESSAGE_CHAR_UUID: UUID = UUID.fromString("e2f45d6d-5b4a-47d2-8a51-9f7b6d2f1b6a")
}

