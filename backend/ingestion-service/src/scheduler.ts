import fs from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import criticalRoutes from './config/critical-routes.json';
import type { RawSignal } from './normalizer';

interface CityConfig {
  name: string;
  lat: number;
  lng: number;
}

interface CriticalRouteConfig {
  segment_id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  free_flow_time_minutes: number;
}

const cities: CityConfig[] = [
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
  { name: 'Patna', lat: 25.5941, lng: 85.1376 },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
];

function weatherSeverityLabel(code: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (code >= 900 && code <= 902) {
    return 'CRITICAL';
  }
  if (code >= 200 && code <= 232) {
    return 'HIGH';
  }
  if (code >= 500 && code <= 531) {
    return code >= 520 ? 'HIGH' : 'MEDIUM';
  }
  return 'LOW';
}

async function fetchWeatherSignals(): Promise<RawSignal[]> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return [];
  }

  const responses = await Promise.all(
    cities.map(async (city) => {
      const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: city.lat,
          lon: city.lng,
          appid: apiKey,
          units: 'metric',
        },
        timeout: 8000,
      });

      const weatherCode = Number(data.weather?.[0]?.id ?? 0);
      return {
        source: 'openweathermap',
        signalType: 'weather',
        coordinates: { lat: city.lat, lng: city.lng },
        payload: {
          city: city.name,
          temperature_c: data.main?.temp ?? 0,
          precipitation_mm_per_hr: Number(data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0),
          rain_1h: Number(data.rain?.['1h'] ?? 0),
          rain_3h: Number(data.rain?.['3h'] ?? 0),
          wind_speed_kmh: Number(data.wind?.speed ?? 0) * 3.6,
          wind_deg: Number(data.wind?.deg ?? 0),
          weather_code: weatherCode,
          weather_risk: weatherSeverityLabel(weatherCode),
          visibility_m: Number(data.visibility ?? 0),
          observed_at: new Date().toISOString(),
        },
      } satisfies RawSignal;
    }),
  );

  return responses;
}

async function fetchTrafficSignals(): Promise<RawSignal[]> {
  const apiKey = process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const routeSignals = await Promise.all(
    (criticalRoutes as CriticalRouteConfig[]).map(async (route) => {
      const { data } = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${route.origin.lat},${route.origin.lng}`,
          destination: `${route.destination.lat},${route.destination.lng}`,
          departure_time: 'now',
          key: apiKey,
        },
        timeout: 8000,
      });

      const leg = data.routes?.[0]?.legs?.[0];
      const currentTravelTime = Number(leg?.duration_in_traffic?.value ?? leg?.duration?.value ?? route.free_flow_time_minutes * 60) / 60;
      const trafficRatio = currentTravelTime / route.free_flow_time_minutes;

      return {
        source: 'google-maps-roads',
        signalType: 'traffic',
        coordinates: route.origin,
        payload: {
          segment_id: route.segment_id,
          free_flow_travel_time_minutes: route.free_flow_time_minutes,
          current_travel_time_minutes: currentTravelTime,
          traffic_ratio: Number(trafficRatio.toFixed(2)),
          congestion_level: trafficRatio > 2.5 ? 'HIGH' : 'NORMAL',
          checked_at: new Date().toISOString(),
        },
      } satisfies RawSignal;
    }),
  );

  return routeSignals;
}

async function fetchSensorSignals(): Promise<RawSignal[]> {
  const sensorPath = process.env.LOCAL_SENSOR_FILE
    ? path.resolve(process.cwd(), process.env.LOCAL_SENSOR_FILE)
    : path.resolve(__dirname, 'config', 'sensors.json');
  const rawContent = await fs.readFile(sensorPath, 'utf8');
  const sensors = JSON.parse(rawContent) as Array<Record<string, unknown>>;

  return sensors.map((sensor) => ({
    source: 'local-sensor-feed',
    signalType: String(sensor.sensor_type ?? 'sensor'),
    coordinates: {
      lat: Number(sensor.lat ?? 0),
      lng: Number(sensor.lng ?? 0),
    },
    payload: {
      ...sensor,
      water_level_m: Number(sensor.water_level_m ?? 0),
      wind_speed_kmh: Number(sensor.wind_speed_kmh ?? 0),
      vibration_score: Number(sensor.vibration_score ?? 0),
      traffic_ratio: Number(sensor.traffic_ratio ?? 0),
    },
  }));
}

/**
 * Collects all current raw signals from weather, traffic, and sensor sources.
 */
export async function pollDisasterSignals(): Promise<RawSignal[]> {
  const settled = await Promise.allSettled([
    fetchWeatherSignals(),
    fetchTrafficSignals(),
    fetchSensorSignals(),
  ]);

  return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}
