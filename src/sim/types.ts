import type { Graph } from './graph';

export interface StepMetrics {
  step: number;
  operationalNodes: number;
  failedNodes: number;
  operationalEdges: number;
  failedEdges: number;
  connectedComponents: number;
  packetsDelivered: number;
  packetsAttempted: number;
  deliveryRate: number;
  avgRouteCost: number;
  avgHopCount: number;
  sourceConnected: boolean;
  destinationConnected: boolean;
  totalConductance: number;
  routePath: number[];
}

export interface StrategyResult {
  strategy: 'conventional' | 'adaptive';
  steps: StepMetrics[];
  finalPath: number[];
  finalCost: number;
  finalHops: number;
  reachedDestination: boolean;
  recoveryStep: number | null; // step at which delivery rate returns to ≥ pre-disruption rate
  executionMs: number;
  eventLog: SimulationEvent[];
}

export interface SimulationEvent {
  step: number;
  message: string;
  type: 'info' | 'disruption' | 'recovery' | 'failure' | 'success';
}

export interface SimulationResult {
  config: SimRunConfig;
  conventional: StrategyResult;
  adaptive: StrategyResult;
  disruption: {
    type: string;
    description: string;
    affectedNodes: number[];
    affectedEdges: number[];
    costIncreaseFactor: number;
  };
  timestamp: string;
  algorithmVersion: string;
}

export type RoutingStrategy = 'conventional' | 'adaptive' | 'compare';
export type Density = 'sparse' | 'balanced' | 'dense';
export type DisruptionType =
  | 'none'
  | 'node-failure'
  | 'connection-failure'
  | 'increased-cost'
  | 'multiple-failures';

export interface SimRunConfig {
  nodeCount: number;
  density: Density;
  seed: number;
  sourceNode: number;
  destinationNode: number;
  packetCount: number;
  disruptionType: DisruptionType;
  disruptionSeverity: number;
  disruptionSeed: number;
  strategy: RoutingStrategy;
  maxSteps: number;
}

export const ALGORITHM_VERSION = 'spore-net-2.0.0';

/**
 * Count connected components in the operational subgraph.
 */
export function countComponents(graph: Graph): number {
  const visited = new Set<number>();
  let components = 0;

  for (const node of graph.nodes) {
    if (visited.has(node.id) || node.failed) continue;
    // BFS
    components++;
    const queue = [node.id];
    visited.add(node.id);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (graph.nodes[cur].failed) continue;
      const neighbors = graph.adjacency.get(cur) ?? [];
      for (const { to, edgeIndex } of neighbors) {
        if (visited.has(to)) continue;
        if (!graph.edges[edgeIndex].operational) continue;
        if (graph.nodes[to].failed) continue;
        visited.add(to);
        queue.push(to);
      }
    }
  }
  return components;
}

/**
 * Compute metrics for a graph at a given step.
 */
export function computeMetrics(
  graph: Graph,
  step: number,
  packetsAttempted: number,
  routePath: number[],
  routeCost: number,
  routeHops: number,
  reachedDestination: boolean,
  source: number,
  destination: number,
): StepMetrics {
  const operationalNodes = graph.nodes.filter((n) => !n.failed).length;
  const failedNodes = graph.nodes.filter((n) => n.failed).length;
  const operationalEdges = graph.edges.filter((e) => e.operational).length;
  const failedEdges = graph.edges.filter((e) => !e.operational).length;
  const components = countComponents(graph);
  const packetsDelivered = reachedDestination ? packetsAttempted : 0;
  const totalConductance = graph.edges
    .filter((e) => e.operational)
    .reduce((sum, e) => sum + e.conductance, 0);

  return {
    step,
    operationalNodes,
    failedNodes,
    operationalEdges,
    failedEdges,
    connectedComponents: components,
    packetsDelivered,
    packetsAttempted,
    deliveryRate: packetsAttempted > 0 ? packetsDelivered / packetsAttempted : 0,
    avgRouteCost: routeCost === Infinity ? 0 : routeCost,
    avgHopCount: routeHops,
    sourceConnected: !graph.nodes[source]?.isolated,
    destinationConnected: !graph.nodes[destination]?.isolated,
    totalConductance,
    routePath,
  };
}
