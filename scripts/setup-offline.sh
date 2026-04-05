#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$ROOT_DIR/docker"
OSRM_DIR="$DOCKER_DIR/osrm-data"
TILES_DIR="$DOCKER_DIR/map-tiles"
LOCAL_DATA_DIR="$DOCKER_DIR/local-data"

required_cmds=(docker curl sqlite3)
for cmd in "${required_cmds[@]}"; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd"; exit 1; }
done

mkdir -p "$OSRM_DIR" "$TILES_DIR" "$LOCAL_DATA_DIR"

echo "Downloading India OSM data from Geofabrik if not already present..."
if [ ! -f "$OSRM_DIR/india-latest.osm.pbf" ]; then
  curl -L "https://download.geofabrik.de/asia/india-latest.osm.pbf" -o "$OSRM_DIR/india-latest.osm.pbf"
fi

echo "Preparing OSRM routing dataset..."
if [ ! -f "$OSRM_DIR/india-latest.osrm" ]; then
  docker run --rm -t -v "$OSRM_DIR:/data" osrm/osrm-backend \
    osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf
  docker run --rm -t -v "$OSRM_DIR:/data" osrm/osrm-backend \
    osrm-partition /data/india-latest.osrm
  docker run --rm -t -v "$OSRM_DIR:/data" osrm/osrm-backend \
    osrm-customize /data/india-latest.osrm
fi

echo "Preparing placeholder map tile directory..."
mkdir -p "$TILES_DIR/styles"
touch "$TILES_DIR/README.txt"

echo "Initializing local SQLite schema..."
sqlite3 "$LOCAL_DATA_DIR/supplyguard-offline.db" <<'SQL'
CREATE TABLE IF NOT EXISTS shipments (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS drones (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS warehouses (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS inventory (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS rescue_teams (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS survivor_reports (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS drone_dispatches (id TEXT PRIMARY KEY, payload TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS pending_notifications (id TEXT PRIMARY KEY, device_id TEXT, payload TEXT, created_at TEXT);
SQL

echo "Building and starting offline deployment..."
docker compose -f "$DOCKER_DIR/docker-compose.yml" up -d --build

echo "Running quick connectivity check..."
if ping -c 1 -W 1 8.8.8.8 >/dev/null 2>&1; then
  echo "Internet connectivity detected."
else
  echo "No internet connectivity detected. Offline mode remains primary."
fi

LOCAL_IP="$(hostname -I | awk '{print $1}')"
echo
echo "Offline deployment ready."
echo "Field device connection URL: http://${LOCAL_IP}:3000"
echo "Offline command center URL: http://${LOCAL_IP}:3010"
