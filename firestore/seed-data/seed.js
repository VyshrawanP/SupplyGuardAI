/* eslint-disable no-console */
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const { FieldValue, GeoPoint, Timestamp } = admin.firestore;

const now = new Date('2026-04-05T08:00:00.000Z');

const warehouses = [
  {
    id: 'wh-bhubaneswar',
    name: 'Bhubaneswar Central Relief Hub',
    city: 'Bhubaneswar',
    district: 'Khordha',
    location: new GeoPoint(20.2961, 85.8245),
    assigned_population: 45000,
    address: 'Rasulgarh Industrial Estate, Bhubaneswar, Odisha',
  },
  {
    id: 'wh-cuttack',
    name: 'Cuttack Riverbank Warehouse',
    city: 'Cuttack',
    district: 'Cuttack',
    location: new GeoPoint(20.4625, 85.8828),
    assigned_population: 30000,
    address: 'Jobra Road, Cuttack, Odisha',
  },
  {
    id: 'wh-puri',
    name: 'Puri Coastal Response Store',
    city: 'Puri',
    district: 'Puri',
    location: new GeoPoint(19.8135, 85.8312),
    assigned_population: 38000,
    address: 'Marine Drive Link Road, Puri, Odisha',
  },
  {
    id: 'wh-berhampur',
    name: 'Berhampur South Logistics Yard',
    city: 'Berhampur',
    district: 'Ganjam',
    location: new GeoPoint(19.3149, 84.7941),
    assigned_population: 26000,
    address: 'NH16 Service Lane, Berhampur, Odisha',
  },
  {
    id: 'wh-sambalpur',
    name: 'Sambalpur Inland Support Depot',
    city: 'Sambalpur',
    district: 'Sambalpur',
    location: new GeoPoint(21.4669, 83.9756),
    assigned_population: 22000,
    address: 'Ainthapali Freight Cluster, Sambalpur, Odisha',
  },
];

const inventoryTemplates = [
  ['rice_kg', 'kg', 4000, 900],
  ['dal_kg', 'kg', 1800, 500],
  ['food_packet_adult', 'packet', 9000, 1800],
  ['food_packet_child', 'packet', 4500, 900],
  ['emergency_ration_bar', 'pack', 6000, 1000],
  ['biscuit_pack', 'pack', 7000, 1300],
  ['drinking_water_litre', 'litre', 25000, 6000],
  ['water_purification_tablet', 'strip', 3200, 500],
  ['oral_rehydration_salts', 'sachet', 2400, 400],
  ['first_aid_kit', 'kit', 450, 90],
  ['antibiotic_course', 'box', 300, 60],
  ['pain_reliever_strip', 'strip', 900, 150],
  ['insulin_vial', 'vial', 120, 20],
  ['blanket', 'piece', 2600, 450],
  ['tarpaulin_sheet', 'piece', 950, 180],
  ['life_jacket', 'piece', 150, 40],
  ['solar_lantern', 'piece', 600, 80],
  ['baby_formula', 'tin', 420, 70],
  ['sanitary_kit', 'kit', 1600, 300],
  ['diesel_litre', 'litre', 14000, 2000],
];

const shipments = [
  {
    id: 'ship-od-001',
    route_id: 'od-bbsr-puri-01',
    origin_warehouse_id: 'wh-bhubaneswar',
    destination_name: 'Puri District Emergency Shelter',
    status: 'IN_TRANSIT',
    coordinates: new GeoPoint(19.9928, 85.8617),
    origin: new GeoPoint(20.2961, 85.8245),
    destination: new GeoPoint(19.8135, 85.8312),
    cargo_summary: ['food_packet_adult', 'drinking_water_litre', 'blanket'],
    current_eta_minutes: 96,
    polyline: [
      { lat: 20.2961, lng: 85.8245 },
      { lat: 20.1407, lng: 85.8402 },
      { lat: 19.9928, lng: 85.8617 },
      { lat: 19.8135, lng: 85.8312 },
    ],
  },
  {
    id: 'ship-od-002',
    route_id: 'od-ctc-bbsr-01',
    origin_warehouse_id: 'wh-cuttack',
    destination_name: 'Bhubaneswar Command Center',
    status: 'IN_TRANSIT',
    coordinates: new GeoPoint(20.382, 85.8462),
    origin: new GeoPoint(20.4625, 85.8828),
    destination: new GeoPoint(20.2961, 85.8245),
    cargo_summary: ['diesel_litre', 'solar_lantern'],
    current_eta_minutes: 42,
    polyline: [
      { lat: 20.4625, lng: 85.8828 },
      { lat: 20.4271, lng: 85.8693 },
      { lat: 20.382, lng: 85.8462 },
      { lat: 20.2961, lng: 85.8245 },
    ],
  },
  {
    id: 'ship-od-003',
    route_id: 'od-puri-konark-01',
    origin_warehouse_id: 'wh-puri',
    destination_name: 'Konark Relief Point',
    status: 'DELAYED',
    coordinates: new GeoPoint(19.9128, 85.9293),
    origin: new GeoPoint(19.8135, 85.8312),
    destination: new GeoPoint(19.8876, 86.0945),
    cargo_summary: ['life_jacket', 'first_aid_kit', 'tarpaulin_sheet'],
    current_eta_minutes: 74,
    polyline: [
      { lat: 19.8135, lng: 85.8312 },
      { lat: 19.8724, lng: 85.8811 },
      { lat: 19.9128, lng: 85.9293 },
      { lat: 19.8876, lng: 86.0945 },
    ],
  },
  {
    id: 'ship-od-004',
    route_id: 'od-brmpr-chatrapur-01',
    origin_warehouse_id: 'wh-berhampur',
    destination_name: 'Chatrapur Base Camp',
    status: 'IN_TRANSIT',
    coordinates: new GeoPoint(19.2407, 84.8621),
    origin: new GeoPoint(19.3149, 84.7941),
    destination: new GeoPoint(19.3553, 84.9839),
    cargo_summary: ['food_packet_child', 'baby_formula', 'sanitary_kit'],
    current_eta_minutes: 58,
    polyline: [
      { lat: 19.3149, lng: 84.7941 },
      { lat: 19.2822, lng: 84.8244 },
      { lat: 19.2407, lng: 84.8621 },
      { lat: 19.3553, lng: 84.9839 },
    ],
  },
  {
    id: 'ship-od-005',
    route_id: 'od-sbp-bgh-01',
    origin_warehouse_id: 'wh-sambalpur',
    destination_name: 'Bargarh Evacuation Camp',
    status: 'IN_TRANSIT',
    coordinates: new GeoPoint(21.3651, 83.7468),
    origin: new GeoPoint(21.4669, 83.9756),
    destination: new GeoPoint(21.3335, 83.6191),
    cargo_summary: ['rice_kg', 'dal_kg', 'drinking_water_litre'],
    current_eta_minutes: 88,
    polyline: [
      { lat: 21.4669, lng: 83.9756 },
      { lat: 21.417, lng: 83.8584 },
      { lat: 21.3651, lng: 83.7468 },
      { lat: 21.3335, lng: 83.6191 },
    ],
  },
  {
    id: 'ship-od-006',
    route_id: 'od-bbsr-cuttack-02',
    origin_warehouse_id: 'wh-bhubaneswar',
    destination_name: 'Cuttack Medical Annex',
    status: 'AT_RISK',
    coordinates: new GeoPoint(20.3481, 85.8425),
    origin: new GeoPoint(20.2961, 85.8245),
    destination: new GeoPoint(20.4625, 85.8828),
    cargo_summary: ['insulin_vial', 'antibiotic_course', 'oral_rehydration_salts'],
    current_eta_minutes: 51,
    polyline: [
      { lat: 20.2961, lng: 85.8245 },
      { lat: 20.3481, lng: 85.8425 },
      { lat: 20.4124, lng: 85.8643 },
      { lat: 20.4625, lng: 85.8828 },
    ],
  },
  {
    id: 'ship-od-007',
    route_id: 'od-puri-brahmagiri-01',
    origin_warehouse_id: 'wh-puri',
    destination_name: 'Brahmagiri Flood Shelter',
    status: 'IN_TRANSIT',
    coordinates: new GeoPoint(19.7418, 85.6581),
    origin: new GeoPoint(19.8135, 85.8312),
    destination: new GeoPoint(19.7922, 85.6215),
    cargo_summary: ['tarpaulin_sheet', 'blanket', 'water_purification_tablet'],
    current_eta_minutes: 69,
    polyline: [
      { lat: 19.8135, lng: 85.8312 },
      { lat: 19.7811, lng: 85.7488 },
      { lat: 19.7418, lng: 85.6581 },
      { lat: 19.7922, lng: 85.6215 },
    ],
  },
  {
    id: 'ship-od-008',
    route_id: 'od-ctc-jagatpur-01',
    origin_warehouse_id: 'wh-cuttack',
    destination_name: 'Jagatpur Food Depot',
    status: 'IN_TRANSIT',
    coordinates: new GeoPoint(20.5173, 85.8426),
    origin: new GeoPoint(20.4625, 85.8828),
    destination: new GeoPoint(20.5324, 85.8351),
    cargo_summary: ['biscuit_pack', 'food_packet_adult', 'solar_lantern'],
    current_eta_minutes: 31,
    polyline: [
      { lat: 20.4625, lng: 85.8828 },
      { lat: 20.4892, lng: 85.8649 },
      { lat: 20.5173, lng: 85.8426 },
      { lat: 20.5324, lng: 85.8351 },
    ],
  },
];

const drones = [
  ['drn-001', 'DJI FlyCart 30', 'operator-001', 20.2961, 85.8245, 82, 30],
  ['drn-002', 'AeroBridge Mk-II', 'operator-002', 19.8135, 85.8312, 61, 18],
  ['drn-003', 'Skylift Coastal', 'operator-003', 20.4625, 85.8828, 44, 12],
  ['drn-004', 'SkyAid VTOL', 'operator-004', 19.3149, 84.7941, 91, 25],
  ['drn-005', 'ReliefWing X4', 'operator-005', 19.8876, 86.0945, 37, 15],
  ['drn-006', 'Sambal HeavyLift', 'operator-006', 21.4669, 83.9756, 73, 35],
];

const hospitals = [
  ['manipal', 'Manipal Hospital (HAL Road)', 12.9580, 77.6493, 450, 140, 48, 12],
  ['vydehi', 'Vydehi Hospital (Whitefield)', 12.9850, 77.7288, 520, 160, 54, 14],
  ['cmh', 'CMH Hospital (Indiranagar)', 12.9742, 77.6401, 260, 72, 24, 6],
  ['st-johns', 'St. John’s Medical College', 12.9346, 77.6103, 400, 110, 44, 10],
  ['apollo', 'Apollo Hospital (Bannerghatta)', 12.8891, 77.5970, 350, 96, 36, 9],
  ['bgs', 'BGS Global Hospital', 12.9031, 77.5167, 280, 78, 26, 7],
  ['aster', 'Aster CMI Hospital', 13.0330, 77.5947, 380, 120, 40, 11],
  ['bowring', 'Bowring & Lady Curzon Hospital', 12.9834, 77.6096, 300, 90, 28, 8],
  ['narayana', 'Narayana Health City', 12.8011, 77.7022, 520, 180, 60, 16],
  ['fortis', 'Fortis Hospital (Bannerghatta)', 12.8932, 77.5994, 320, 102, 34, 10],
  ['columbia', 'Columbia Asia Hospital (Hebbal)', 13.0555, 77.5960, 240, 84, 22, 6],
  ['sakra', 'Sakra World Hospital', 12.9141, 77.6687, 280, 92, 28, 8],
  ['narayana-maz', 'Narayana Mazumdar Shaw', 12.8593, 77.6629, 300, 100, 30, 8],
  ['victoria', 'Victoria Hospital', 12.9634, 77.5720, 500, 150, 52, 14],
  ['nimhans', 'NIMHANS', 12.9430, 77.5963, 280, 96, 20, 4],
];

const rescueTeams = [
  ['team-puri-1', 'Puri Rapid Team Alpha', 19.8135, 85.8312, 18],
  ['team-puri-2', 'Pipili Water Response', 20.1146, 85.8311, 14],
  ['team-puri-3', 'Brahmagiri Medical Unit', 19.7906, 85.6295, 12],
  ['team-puri-4', 'Konark Evacuation Squad', 19.8876, 86.0945, 16],
];

const disasterEvents = [
  {
    id: 'event-heavy-rain-puri',
    type: 'HEAVY_RAIN',
    severity: 4,
    coordinates: new GeoPoint(19.9054, 85.9021),
    affected_radius_km: 22,
    source: 'OpenWeatherMap',
    processed: false,
    raw_payload: { precipitation_mm_per_hr: 34, wind_speed_kmh: 48, city: 'Puri' },
  },
  {
    id: 'event-roadblock-pipili',
    type: 'ROAD_BLOCKAGE',
    severity: 3,
    coordinates: new GeoPoint(20.1512, 85.8242),
    affected_radius_km: 6,
    source: 'road-sensor',
    processed: false,
    raw_payload: { traffic_ratio: 3.2, vibration: 0.88, segment_id: 'nh316-pipili-01' },
  },
  {
    id: 'event-cyclone-warning-bay',
    type: 'CYCLONE',
    severity: 5,
    coordinates: new GeoPoint(19.6023, 86.4111),
    affected_radius_km: 120,
    source: 'imd-forecast',
    processed: false,
    raw_payload: { wind_speed_kmh: 118, pressure_hpa: 968, bulletin: 'Cyclone warning for Odisha coast' },
  },
];

async function seedHospitals() {
  console.log('Seeding hospitals + capacity...');
  const batch = db.batch();

  hospitals.forEach(([id, name, lat, lng, bedsTotal, bedsAvailable, icuTotal, icuAvailable]) => {
    const hospitalRef = db.collection('hospitals').doc(id);
    batch.set(
      hospitalRef,
      {
        name,
        location: new GeoPoint(lat, lng),
        updated_at: Timestamp.fromDate(now),
      },
      { merge: true },
    );

    const capacityRef = hospitalRef.collection('capacity').doc('current');
    batch.set(
      capacityRef,
      {
        beds_total: bedsTotal,
        beds_available: bedsAvailable,
        icu_total: icuTotal,
        icu_available: icuAvailable,
        updated_at: Timestamp.fromDate(now),
      },
      { merge: true },
    );
  });

  await batch.commit();
  console.log('Hospitals seeded.');
}

const suppliers = Array.from({ length: 12 }).map((_, index) => {
  const id = `supplier-${String(index + 1).padStart(3, '0')}`;
  const cities = [
    'Bhubaneswar', 'Cuttack', 'Puri', 'Berhampur', 'Sambalpur', 'Khurda',
    'Balasore', 'Jagatsinghpur', 'Jajpur', 'Rayagada', 'Kendrapara', 'Koraput',
  ];
  const latLng = [
    [20.2961, 85.8245], [20.4625, 85.8828], [19.8135, 85.8312], [19.3149, 84.7941],
    [21.4669, 83.9756], [20.1833, 85.6167], [21.4942, 86.9310], [20.2549, 86.1710],
    [20.8501, 86.3377], [19.1712, 83.4160], [20.5013, 86.4227], [18.8135, 82.7123],
  ];
  const [lat, lng] = latLng[index];

  return {
    id,
    name: `Odisha Relief Supplier ${index + 1}`,
    contact_name: `Coordinator ${index + 1}`,
    city: cities[index],
    phone: `+91-70000${String(index + 100).slice(1)}`,
    email: `supplier${index + 1}@supplyguard.ai`,
    response_time_hours: 2 + (index % 5),
    location: new GeoPoint(lat, lng),
    items_supported: inventoryTemplates.slice(index % 6, (index % 6) + 6).map(([name]) => name),
  };
});

const aiExplanations = Array.from({ length: 10 }).map((_, index) => ({
  id: `explanation-${index + 1}`,
  event_id: disasterEvents[index % disasterEvents.length].id,
  action_taken: index % 2 === 0 ? 'ROUTE_REROUTED' : 'DRONE_PREPARED',
  situation_summary: `Historical Odisha event ${index + 1} summary.`,
  why_action_was_taken: 'Risk score exceeded the configured operational threshold.',
  expected_outcome: 'Delay is expected to reduce and supply continuity should improve.',
  confidence_narrative: 'Confidence remained high because weather and traffic data were fresh.',
  coordinator_guidance: 'Monitor route recovery and confirm field telemetry.',
  created_at: Timestamp.fromDate(new Date(now.getTime() - index * 86400000)),
}));

function generateLifeJackets() {
  return Array.from({ length: 50 }).map((_, index) => ({
    id: `lj-${String(index + 1).padStart(3, '0')}`,
    jacket_id: `LJ-OD-${String(index + 1).padStart(4, '0')}`,
    status: index < 8 ? 'IN_USE' : 'AVAILABLE',
    warehouse_id: warehouses[index % warehouses.length].id,
    size: ['S', 'M', 'L'][index % 3],
    last_scanned_at: Timestamp.fromDate(new Date(now.getTime() - index * 3600000)),
    assigned_dispatch_id: index < 8 ? `dispatch-${String(index + 1).padStart(3, '0')}` : null,
  }));
}

async function seedWarehouses(batch) {
  for (const warehouse of warehouses) {
    const warehouseRef = db.collection('warehouses').doc(warehouse.id);
    batch.set(warehouseRef, {
      ...warehouse,
      status: 'OPERATIONAL',
      created_at: Timestamp.fromDate(now),
      updated_at: FieldValue.serverTimestamp(),
    });

    for (const [itemName, unit, quantity, threshold] of inventoryTemplates) {
      batch.set(warehouseRef.collection('inventory').doc(itemName), {
        item_name: itemName,
        unit,
        quantity,
        minimum_threshold: threshold,
        daily_consumption_rate: Math.max(10, Math.round(threshold / 5)),
        last_restocked_at: Timestamp.fromDate(new Date(now.getTime() - 2 * 86400000)),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
  }
}

async function seedShipments(batch) {
  for (const shipment of shipments) {
    batch.set(db.collection('shipments').doc(shipment.id), {
      ...shipment,
      driver_name: `Driver ${shipment.id.slice(-3)}`,
      last_position_update: Timestamp.fromDate(new Date(now.getTime() - 10 * 60000)),
      updated_at: FieldValue.serverTimestamp(),
      created_at: Timestamp.fromDate(new Date(now.getTime() - 4 * 3600000)),
    });
  }
}

async function seedDrones(batch) {
  for (const [id, model, operatorUid, lat, lng, battery, payload] of drones) {
    batch.set(db.collection('drone-fleet').doc(id), {
      drone_id: id,
      model,
      operator_uid: operatorUid,
      status: 'IDLE',
      battery_percent: battery,
      max_payload_kg: payload,
      available_payload_kg: payload,
      cruise_speed_kmh: 60,
      home_depot: new GeoPoint(lat, lng),
      current_position: new GeoPoint(lat, lng),
      created_at: Timestamp.fromDate(now),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}

async function seedRescueTeams(batch) {
  for (const [id, name, lat, lng, capacity] of rescueTeams) {
    batch.set(db.collection('rescue-teams').doc(id), {
      team_id: id,
      name,
      status: 'AVAILABLE',
      current_position: new GeoPoint(lat, lng),
      team_capacity: capacity,
      supplies_adequacy: 0.8,
      roster: [`${name} Lead`, `${name} Medic`, `${name} Driver`],
      last_status_update: Timestamp.fromDate(new Date(now.getTime() - 15 * 60000)),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}

async function seedEvents(batch) {
  for (const event of disasterEvents) {
    batch.set(db.collection('disaster-events').doc(event.id), {
      ...event,
      created_at: Timestamp.fromDate(now),
      expires_at: Timestamp.fromDate(new Date(now.getTime() + 72 * 3600000)),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}

async function seedSuppliers(batch) {
  for (const supplier of suppliers) {
    batch.set(db.collection('suppliers').doc(supplier.id), {
      ...supplier,
      created_at: Timestamp.fromDate(now),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}

async function seedLedger(batch) {
  for (const record of generateLifeJackets()) {
    batch.set(db.collection('life-jacket-ledger').doc(record.id), {
      ...record,
      created_at: Timestamp.fromDate(now),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}

async function seedExplanations(batch) {
  for (const explanation of aiExplanations) {
    batch.set(db.collection('ai-explanations').doc(explanation.id), explanation);
  }
}

async function seedUsers(batch) {
  const roles = [
    ['admin-001', 'admin'],
    ['operator-001', 'drone_operator'],
    ['operator-002', 'drone_operator'],
    ['operator-003', 'drone_operator'],
    ['operator-004', 'drone_operator'],
    ['operator-005', 'drone_operator'],
    ['operator-006', 'drone_operator'],
    ['coordinator-001', 'field_coordinator'],
    ['supplier-001', 'supplier'],
    ['observer-001', 'observer'],
  ];

  for (const [uid, role] of roles) {
    batch.set(db.collection('users').doc(uid), {
      uid,
      role,
      display_name: uid,
      device_token: `${uid}-device-token`,
      created_at: Timestamp.fromDate(now),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}

async function main() {
  console.log('Seeding SupplyGuard AI Odisha cyclone scenario...');
  const batch = db.batch();

  await seedWarehouses(batch);
  await seedShipments(batch);
  await seedDrones(batch);
  await seedHospitals();
  await seedRescueTeams(batch);
  await seedEvents(batch);
  await seedSuppliers(batch);
  await seedLedger(batch);
  await seedExplanations(batch);
  await seedUsers(batch);

  await batch.commit();
  console.log('Seed completed successfully.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
