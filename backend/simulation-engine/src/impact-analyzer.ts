import { getFirestore, type SimulationResult } from './shared';

/**
 * Aggregates a session-scoped simulation namespace into a summarized impact report.
 */
export async function analyzeSimulationImpact(
  sessionId: string,
  scenarioType: string,
  scenarioParameters: Record<string, unknown>,
): Promise<SimulationResult> {
  const firestore = getFirestore();
  const [shipments, warehouses, drones, rescueAssignments, alerts] = await Promise.all([
    firestore.collection(`sim-${sessionId}-shipments`).get(),
    firestore.collection(`sim-${sessionId}-warehouses`).get(),
    firestore.collection('drone-dispatches').get(),
    firestore.collection('rescue-assignments').get(),
    firestore.collection('inventory-alerts').get(),
  ]);

  const disruptedShipments = shipments.docs.filter((doc) => ['IMPASSABLE', 'BLOCKED'].includes(String(doc.get('simulated_route_status') || ''))).map((doc) => ({ id: doc.id, ...doc.data() }));
  const inaccessibleWarehouses = warehouses.docs.filter((doc) => doc.get('simulated_status') === 'INACCESSIBLE').map((doc) => ({ id: doc.id, ...doc.data() }));
  const inventoryRunway: Record<string, number> = {};

  for (const warehouse of warehouses.docs) {
    const inventory = await warehouse.ref.collection('inventory').get();
    for (const item of inventory.docs) {
      inventoryRunway[`${warehouse.id}:${item.id}`] = Number(item.get('days_remaining') || 0);
    }
  }

  return {
    session_id: sessionId,
    scenario_type: scenarioType,
    scenario_parameters: scenarioParameters,
    impact_summary: {
      shipments_disrupted: disruptedShipments.length,
      shipments_rerouted: Math.max(0, Math.round(disruptedShipments.length * 0.7)),
      drones_dispatched: drones.size,
      warehouses_inaccessible: inaccessibleWarehouses.length,
      estimated_survivors: Math.max(25, disruptedShipments.length * 18),
      rescue_missions_triggered: rescueAssignments.size,
      inventory_depleted_items: Object.entries(inventoryRunway).filter(([, days]) => days <= 1).map(([item]) => item),
      supplier_alerts_generated: alerts.size,
      estimated_response_time_minutes: Math.max(20, disruptedShipments.length * 12),
      estimated_lives_at_risk: Math.max(5, inaccessibleWarehouses.length * 20 + disruptedShipments.length * 8),
    },
    affected_shipments: disruptedShipments,
    affected_warehouses: inaccessibleWarehouses,
    drone_deployment_plan: drones.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    rescue_deployment_plan: rescueAssignments.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    inventory_runway: inventoryRunway,
    pre_positioning_recommendation: scenarioType === 'CYCLONE'
      ? [{
          depot: 'staging-depot-west',
          action: 'PREPOSITION_RELIEF_SUPPLIES',
          quantity_factor: 1.4,
        }]
      : [],
    computed_at: new Date().toISOString(),
  };
}
