import type { Graph } from './graph';
import { generateGraph, cloneGraph, recomputeIsolated } from './graph';
import { dijkstra } from './dijkstra';
import { physarumStep, conductanceRoute, DEFAULT_PHYSARUM_PARAMS } from './physarum';
import { applyDisruption } from './disruption';
import {
  computeMetrics,
  ALGORITHM_VERSION,
  type SimRunConfig,
  type SimulationResult,
  type StrategyResult,
  type StepMetrics,
  type SimulationEvent,
} from './types';

/**
 * Run a single strategy simulation.
 * Both strategies get identical initial graphs and identical disruptions.
 */
function runStrategy(
  strategy: 'conventional' | 'adaptive',
  graph: Graph,
  source: number,
  destination: number,
  packetCount: number,
  maxSteps: number,
  preDisruptionDeliveryRate: number,
): StrategyResult {
  const steps: StepMetrics[] = [];
  const eventLog: SimulationEvent[] = [];
  const start = performance.now();

  // Step 0: initial route before disruption (graph already has disruption applied at this point)
  // The caller applies disruption BEFORE calling this, so step 0 is post-disruption.
  // Pre-disruption metrics are computed by the caller separately.

  let currentPath: number[] = [];
  let currentCost = Infinity;
  let currentHops = 0;
  let reached = false;

  for (let step = 0; step <= maxSteps; step++) {
    if (strategy === 'adaptive') {
      // Run adaptation: solve pressure, compute flows, update conductance
      physarumStep(graph, source, destination, 1.0, DEFAULT_PHYSARUM_PARAMS);
      // Route using conductance-weighted path
      const route = conductanceRoute(graph, source, destination);
      currentPath = route.path;
      currentCost = route.cost;
      currentHops = route.hops;
      reached = route.reachable;
    } else {
      // Conventional: just recompute shortest path
      const route = dijkstra(graph, source, destination);
      currentPath = route.path;
      currentCost = route.cost;
      currentHops = route.hops;
      reached = route.reachable;
    }

    const metrics = computeMetrics(
      graph,
      step,
      packetCount,
      currentPath,
      currentCost,
      currentHops,
      reached,
      source,
      destination,
    );
    steps.push(metrics);

    if (step === 0) {
      eventLog.push({
        step: 0,
        message: reached
          ? `${strategy} strategy: route established with ${currentHops} hops, cost ${currentCost.toFixed(4)}.`
          : `${strategy} strategy: destination unreachable after disruption.`,
        type: reached ? 'success' : 'failure',
      });
    }

    // Check for recovery: delivery rate returns to ≥ pre-disruption level
    if (
      strategy === 'adaptive' &&
      preDisruptionDeliveryRate > 0 &&
      metrics.deliveryRate >= preDisruptionDeliveryRate &&
      !eventLog.some((e) => e.type === 'recovery')
    ) {
      eventLog.push({
        step,
        message: `Adaptive strategy: delivery rate recovered to ${preDisruptionDeliveryRate.toFixed(2)} at step ${step}.`,
        type: 'recovery',
      });
    }

    // For conventional, log if it cannot recover
    if (
      strategy === 'conventional' &&
      !reached &&
      step === maxSteps
    ) {
      eventLog.push({
        step,
        message: `Conventional strategy: destination remained unreachable through ${maxSteps} steps.`,
        type: 'failure',
      });
    }
  }

  const recoveryEvent = eventLog.find((e) => e.type === 'recovery');
  const recoveryStep = recoveryEvent ? recoveryEvent.step : null;

  const end = performance.now();

  return {
    strategy,
    steps,
    finalPath: currentPath,
    finalCost: currentCost,
    finalHops: currentHops,
    reachedDestination: reached,
    recoveryStep,
    executionMs: end - start,
    eventLog,
  };
}

/**
 * Run a complete simulation experiment.
 *
 * Pipeline:
 * 1. Generate initial graph
 * 2. Compute pre-disruption baseline route
 * 3. Clone graph for each strategy
 * 4. Apply identical disruption to both clones
 * 5. Run both strategies
 * 6. Return combined results
 */
export function runSimulation(config: SimRunConfig): SimulationResult {
  // 1. Generate initial graph
  const baseGraph = generateGraph({
    nodeCount: config.nodeCount,
    density: config.density,
    seed: config.seed,
  });

  // 2. Compute pre-disruption baseline
  const preRoute = dijkstra(baseGraph, config.sourceNode, config.destinationNode);
  const preDisruptionDeliveryRate = preRoute.reachable ? 1.0 : 0.0;

  // 3. Clone for each strategy
  const convGraph = cloneGraph(baseGraph);
  const adaptGraph = cloneGraph(baseGraph);

  // 4. Apply identical disruption to both
  const convDisruption = applyDisruption(
    convGraph,
    { type: config.disruptionType, severity: config.disruptionSeverity, seed: config.disruptionSeed },
    config.sourceNode,
    config.destinationNode,
  );
  const adaptDisruption = applyDisruption(
    adaptGraph,
    { type: config.disruptionType, severity: config.disruptionSeverity, seed: config.disruptionSeed },
    config.sourceNode,
    config.destinationNode,
  );

  recomputeIsolated(convGraph);
  recomputeIsolated(adaptGraph);

  // 5. Run both strategies
  const maxSteps = config.maxSteps || 30;

  const conventional = runStrategy(
    'conventional',
    convGraph,
    config.sourceNode,
    config.destinationNode,
    config.packetCount,
    maxSteps,
    preDisruptionDeliveryRate,
  );

  const adaptive = runStrategy(
    'adaptive',
    adaptGraph,
    config.sourceNode,
    config.destinationNode,
    config.packetCount,
    maxSteps,
    preDisruptionDeliveryRate,
  );

  return {
    config,
    conventional,
    adaptive,
    disruption: {
      type: convDisruption.type,
      description: convDisruption.description,
      affectedNodes: convDisruption.affectedNodes,
      affectedEdges: convDisruption.affectedEdges,
      costIncreaseFactor: convDisruption.costIncreaseFactor,
    },
    timestamp: new Date().toISOString(),
    algorithmVersion: ALGORITHM_VERSION,
  };
}

/**
 * Export the graph state for a given strategy at the current step.
 * Used by the visualization to render node/edge states.
 */
export function getGraphSnapshot(
  config: SimRunConfig,
  strategy: 'conventional' | 'adaptive',
  step: number,
): { nodes: { id: number; x: number; y: number; failed: boolean; isolated: boolean }[]; edges: { from: number; to: number; conductance: number; flow: number; operational: boolean; failed: boolean }[]; path: number[] } {
  const result = runSimulation(config);
  const steps = strategy === 'conventional' ? result.conventional.steps : result.adaptive.steps;
  const stepData = steps[Math.min(step, steps.length - 1)];
  // Re-run to get graph state at this step — simplified: return layout + path
  const graph = generateGraph({ nodeCount: config.nodeCount, density: config.density, seed: config.seed });
  return {
    nodes: graph.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, failed: n.failed, isolated: n.isolated })),
    edges: graph.edges.map((e) => ({
      from: e.from,
      to: e.to,
      conductance: e.conductance,
      flow: e.flow,
      operational: e.operational,
      failed: e.failed,
    })),
    path: stepData?.routePath ?? [],
  };
}
