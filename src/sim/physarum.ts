import type { Graph, SimEdge } from './graph';
import { recomputeIsolated } from './graph';

/**
 * Physarum-inspired adaptive conductance model.
 *
 * Based on the update rule from Tero et al. (2010):
 *   dD_ij/dt = |Q_ij| - μ·D_ij
 *
 * Discrete-time approximation:
 *   D_ij(t+1) = D_ij(t) + dt·(|Q_ij| - μ·D_ij(t))
 *
 * Flow Q_ij is modeled as proportional to conductance × pressure difference:
 *   Q_ij = (D_ij / L_ij) · (p_i - p_j)
 *
 * Pressure is solved as a Poisson equation:
 *   Σ_j (D_ij/L_ij)(p_i - p_j) = s_i
 * where s_i = +demand at source, -demand at sink, 0 elsewhere.
 *
 * This is a transparent discrete approximation of the continuous model.
 */

export interface PhysarumParams {
  mu: number; // decay rate
  dt: number; // time step
  minConductance: number; // floor to prevent numerical issues
  maxConductance: number; // ceiling
  iterations: number; // adaptation iterations per step
}

export const DEFAULT_PHYSARUM_PARAMS: PhysarumParams = {
  mu: 0.15,
  dt: 0.5,
  minConductance: 0.001,
  maxConductance: 20,
  iterations: 20,
};

/**
 * Solve the pressure (potential) field using the Jacobi iterative method.
 * Returns an array of pressure values indexed by node id.
 */
function solvePressure(
  graph: Graph,
  source: number,
  sink: number,
  demand: number,
  iterations: number,
): number[] {
  const n = graph.nodes.length;
  const pressure = new Array<number>(n).fill(0);

  // Build coefficient lists for each node
  const coeffs: { neighbor: number; coef: number }[][] = [];
  for (let i = 0; i < n; i++) {
    coeffs.push([]);
  }

  for (const edge of graph.edges) {
    if (!edge.operational) continue;
    const coef = edge.conductance / edge.length; // D/L
    coeffs[edge.from].push({ neighbor: edge.to, coef });
    coeffs[edge.to].push({ neighbor: edge.from, coef });
  }

  for (let iter = 0; iter < iterations; iter++) {
    const newPressure = [...pressure];
    for (let i = 0; i < n; i++) {
      if (graph.nodes[i].failed) {
        newPressure[i] = 0;
        continue;
      }
      const neighbors = coeffs[i];
      if (neighbors.length === 0) continue;

      let sumCoef = 0;
      let sumPN = 0;
      for (const { neighbor, coef } of neighbors) {
        sumCoef += coef;
        sumPN += coef * pressure[neighbor];
      }

      if (sumCoef < 1e-12) continue;

      let sourceTerm = 0;
      if (i === source) sourceTerm = demand;
      else if (i === sink) sourceTerm = -demand;

      // p_i = (Σ (D/L)·p_j + s_i) / Σ (D/L)
      newPressure[i] = (sumPN + sourceTerm) / sumCoef;
    }
    // Overwrite for next iteration
    for (let i = 0; i < n; i++) pressure[i] = newPressure[i];
  }

  return pressure;
}

/**
 * Compute flow on each edge from the pressure field.
 */
function computeFlows(graph: Graph, pressure: number[]): void {
  for (const edge of graph.edges) {
    if (!edge.operational) {
      edge.flow = 0;
      continue;
    }
    const dp = pressure[edge.from] - pressure[edge.to];
    edge.flow = (edge.conductance / edge.length) * dp;
  }
}

/**
 * Update conductance using the Physarum rule:
 *   D_ij(t+1) = D_ij(t) + dt·(|Q_ij| - μ·D_ij(t))
 */
function updateConductance(graph: Graph, params: PhysarumParams): void {
  for (const edge of graph.edges) {
    if (!edge.operational) {
      edge.conductance = 0;
      continue;
    }
    const absFlow = Math.abs(edge.flow);
    const newD =
      edge.conductance +
      params.dt * (absFlow - params.mu * edge.conductance);

    // Clamp to [minConductance, maxConductance] for numerical stability
    edge.conductance = Math.max(
      params.minConductance,
      Math.min(params.maxConductance, newD),
    );
  }
}

/**
 * Run one full adaptation step:
 * 1. Solve pressure field
 * 2. Compute flows
 * 3. Update conductance
 */
export function physarumStep(
  graph: Graph,
  source: number,
  sink: number,
  demand: number,
  params: PhysarumParams,
): void {
  const pressure = solvePressure(graph, source, sink, demand, params.iterations);
  computeFlows(graph, pressure);
  updateConductance(graph, params);
  recomputeIsolated(graph);
}

/**
 * Find the best route using conductance-weighted path.
 * After adaptation, route through highest-conductance path.
 * Uses a modified Dijkstra where weight = 1/conductance (prefers high conductance).
 */
export function conductanceRoute(
  graph: Graph,
  source: number,
  destination: number,
): { path: number[]; cost: number; hops: number; reachable: boolean } {
  if (source === destination) {
    return { path: [source], cost: 0, hops: 0, reachable: true };
  }

  const n = graph.nodes.length;
  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  dist[source] = 0;
  const visited = new Set<number>();

  // Simple priority queue (O(n²) but fine for n ≤ 100)
  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    let minDist = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visited.has(v) && dist[v] < minDist) {
        minDist = dist[v];
        u = v;
      }
    }
    if (u === -1 || u === destination) break;
    visited.add(u);

    if (graph.nodes[u].failed) continue;

    const neighbors = graph.adjacency.get(u) ?? [];
    for (const { to, edgeIndex } of neighbors) {
      const edge = graph.edges[edgeIndex];
      if (!edge.operational) continue;
      if (graph.nodes[to].failed) continue;

      const weight = 1 / Math.max(edge.conductance, 1e-9);
      const alt = dist[u] + weight;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
      }
    }
  }

  if (dist[destination] === Infinity) {
    return { path: [], cost: Infinity, hops: 0, reachable: false };
  }

  const path: number[] = [];
  let cur = destination;
  while (cur !== -1) {
    path.unshift(cur);
    cur = prev[cur];
  }

  return {
    path,
    cost: dist[destination],
    hops: path.length - 1,
    reachable: true,
  };
}

/**
 * Get the edge connecting two adjacent nodes, or null.
 */
export function findEdge(graph: Graph, a: number, b: number): SimEdge | null {
  for (const { to, edgeIndex } of graph.adjacency.get(a) ?? []) {
    if (to === b) return graph.edges[edgeIndex];
  }
  return null;
}
