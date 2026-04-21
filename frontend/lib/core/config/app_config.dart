class AppConfig {
  static const bool offlineMode = bool.fromEnvironment('OFFLINE_MODE', defaultValue: false);
  static const String localServerIp = String.fromEnvironment('LOCAL_SERVER_IP', defaultValue: '192.168.0.1');
  static const String googleMapsApiKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY');

  // LAN relay lives on the same Express server as the command center.
  static String get lanRelayBaseUrl => 'http://$localServerIp:3000';

  static String get baseUrl => offlineMode
      ? 'http://$localServerIp:3000'
      : 'https://api.supplyguard.ai';

  static String get mapTileUrl => offlineMode
      ? 'http://$localServerIp:8080/styles/basic-preview/{z}/{x}/{y}.png'
      : 'https://maps.googleapis.com/maps/api/tiles';

  static const int rerouteThreshold = 60;
  static const int droneDispatchThreshold = 85;
  static const int criticalInventoryDays = 3;
}
