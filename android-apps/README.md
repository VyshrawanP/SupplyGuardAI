# 📱 SupplyGuard AI: Android Mesh Suite

This folder contains the native Android applications that power the **Resilient Mesh Layer** of SupplyGuard AI. These apps are designed to work in environments with **Zero Connectivity**.

## 🏗️ Architecture

The apps use a shared `core` library and communicate via a decentralized P2P mesh network.

- **:core**: Contains the shared database (Room), networking (Retrofit), and Mesh logic.
- **:victim**: A lightweight app for disaster victims. 
  - Features: One-tap SOS, offline location sharing, and basic survival guides.
- **:rescue**: An app for first responders. 
  - Features: Real-time victim tracking (via mesh), task assignment, and P2P messaging.
- **:command-center**: A mobile version of the command dashboard for field commanders.

## 📡 The Mesh Technology

We utilize **Bluetooth Low Energy (BLE)** and **Wi-Fi Direct** to create an ad-hoc network.
1. **Discovery**: Devices automatically discover each other in the background.
2. **Propagation**: An SOS signal from a `:victim` app "hops" through nearby `:rescue` devices.
3. **Exfiltration**: When any device in the mesh reaches a Wi-Fi hotspot or cellular signal, it automatically syncs the entire mesh state to the Cloud (Firestore).

## 🛠️ Build Instructions

```bash
./gradlew assembleDebug
```
APKs will be generated in each module's `build/outputs/apk/debug/` folder.
