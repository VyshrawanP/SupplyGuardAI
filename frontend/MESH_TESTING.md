# BLE Multi-Hop Mesh Testing (Android)

This repo includes an Android BLE store-and-forward mesh for alerts. It is designed for:

- no cellular signal / no internet
- multiple Android devices within Bluetooth range of each other
- multi-hop propagation using TTL
- optional end-to-end delivery confirmation using ACK

## What “Multi-Hop” Means Here

- Each phone forwards any new alert packet it sees until `ttl` reaches 0.
- Packets are deduped by `id` so loops don’t cause infinite flooding.
- If a `targetDeviceId` is set, only that target sends an ACK back.
- The sender waits for the ACK and reports “out of range” if it never arrives.

## Setup

1. Open `frontend/` in Android Studio or run via Flutter.
2. If your `frontend/android/` folder is missing Gradle wrapper files, run:

```bash
cd frontend
flutter create --platforms=android .
```

Then re-run `flutter pub get`.
2. Make sure all devices have:
   - Bluetooth ON
   - Location ON (needed for scanning on many Android versions)
   - App permissions granted (scan/connect/advertise and location)

## Run

From the repo root:

```bash
cd frontend
flutter pub get
flutter run -d <device_id>
```

## Multi-Hop Test Scenario

Goal: Command phone A should reach target phone D through intermediate phones B and C, with no Wi‑Fi or internet.

1. Put every phone in airplane mode.
2. Turn Wi‑Fi OFF.
3. Turn Bluetooth ON.
4. Launch the app on all devices.
5. Open the `Mesh` tab (Device Mesh).

You should see:

- “Peers” increase as nearby phones are discovered
- each phone’s Device ID (you will use this as the target)

### Send a targeted alert with ACK

1. On target phone D, copy the Device ID from the Mesh screen.
2. On phone A, paste that ID into “Target Device ID”.
3. Tap “Send”.

Expected:

- phone D receives the alert even if A is not directly in range, as long as B/C can bridge the gaps
- phone A shows “Alert sent” only after ACK arrives

### Out-of-range test

1. Move B and C away so there is no continuous chain.
2. Send the targeted alert again from phone A.

Expected:

- phone A shows “Send failed: Out of range…” after ~30 seconds

## Notes / Limitations

- This is BLE flooding, not a guaranteed-delivery routing protocol.
- Multi-hop depends on phones being awake enough to scan/advertise.
- Background operation in Android requires more work (foreground service) for true disaster-grade behavior.

## Implementation Pointers

- Dart mesh logic: `frontend/lib/core/services/mesh/mesh_service.dart`
- Transport interface: `frontend/lib/core/services/mesh/mesh_transport.dart`
- Android BLE transport bridge: `frontend/android/app/src/main/kotlin/.../MeshBlePlugin.kt`
- UI console: `frontend/lib/features/mesh/mesh_console_screen.dart`
