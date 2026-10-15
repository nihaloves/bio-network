import { RNG } from './rng';

export interface SimNode {
  id: number;
  x: number; // layout position 0-1
  y: number;
  failed: boolean;
  isolated: boolean;
}

export interface SimEdge {
  from: number;
  to: number;
  length: number; // base cost / Euclidean distance
  conductance: number; // D_ij, initialized from length
  flow: number; // Q_ij, current modeled flow
  failed: boolean;
  operational: boolean;
}

export interface Graph {
  nodes: SimNode[];
  edges: SimEdge[];
  adjacency: Map<number, { to: number; edgeIndex: number }[]>;
}

export type Density = 'sparse' | 'balanced' | 'dense';

export interface GraphConfig {
  nodeCount: number;
  density: Density;
  seed: number;
}

const DENSITY_TARGET_DEGREE: Record<Density, number> = {
  sparse: 2.2,
  balanced: 3.5,
  dense: 5.5,
};

/**
 * Generate a deterministic geometric graph.
 * Nodes are placed on a unit square using the RNG.
 * Edges connect nodes within a radius chosen so the average degree
 * approximately matches the target for the selected density.
 * A minimum spanning tree is layered underneath to guarantee connectivity.
 */
export function generateGraph(config: GraphConfig): Graph {
  const rng = new RNG(config.seed);
  const n = config.nodeCount;
  const nodes: SimNode[] = [];

  for (let i = 0; i < n; i++) {
    nodes.push({
      id: i,
      x: rng.next(),
      y: rng.next(),
      failed: false,
      isolated: false,
    });
  }

  // --- Build minimum spanning tree via Prim's to ensure connectivity ---
  const mstEdges = new Set<string>();
  const visited = new Set<number>([0]);
  const key: number[] = new Array(n).fill(Infinity);
  const parent: number[] = new Array(n).fill(-1);
  key[0] = 0;

  const dist = (a: SimNode, b: SimNode) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  for (let iter = 0; iter < n - 1; iter++) {
    let u = -1;
    let minKey = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visited.has(v) && key[v] < minKey) {
        minKey = key[v];
        u = v;
      }
    }
    if (u === -1) break; // disconnected safety
    visited.add(u);
    if (parent[u] !== -1) {
      mstEdges.add(edgeKey(parent[u], u));
    }
    for (let v = 0; v < n; v++) {
      if (!visited.has(v)) {
        const d = dist(nodes[u], nodes[v]);
        if (d < key[v]) {
          key[v] = d;
          parent[v] = u;
        }
      }
    }
  }

  // --- Add geometric edges to reach target average degree ---
  const targetDegree = DENSITY_TARGET_DEGREE[config.density];
  const targetEdges = Math.round((targetDegree * n) / 2);
  const edgeSet = new Set<string>(mstEdges);

  // compute radius so that expected number of neighbors ~ targetDegree
  // For uniform points on unit square, E[neighbors within r] ~ pi*r^2*(n-1)
  const radius = Math.sqrt(targetDegree / (Math.PI * (n - 1)));

  const candidates: { from: number; to: number; d: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = dist(nodes[i], nodes[j]);
      if (d <= radius) {
        candidates.push({ from: i, to: j, d });
      }
    }
  }
  // Sort by distance so closer edges are preferred
  candidates.sort((a, b) => a.d - b.d);

  for (const c of candidates) {
    if (edgeSet.size >= targetEdges) break;
    edgeSet.add(edgeKey(c.from, c.to));
  }

  // If still under target (very sparse), add nearest-neighbor edges
  if (edgeSet.size < targetEdges) {
    const allPairs: { from: number; to: number; d: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const k = edgeKey(i, j);
        if (!edgeSet.has(k)) {
          allPairs.push({ from: i, to: j, d: dist(nodes[i], nodes[j]) });
        }
      }
    }
    allPairs.sort((a, b) => a.d - b.d);
    for (const p of allPairs) {
      if (edgeSet.size >= targetEdges) break;
      edgeSet.add(edgeKey(p.from, p.to));
    }
  }

  // --- Build edge list ---
  const edges: SimEdge[] = [];
  const adjacency = new Map<number, { to: number; edgeIndex: number }[]>();
  for (let i = 0; i < n; i++) adjacency.set(i, []);

  for (const key of edgeSet) {
    const [from, to] = parseEdgeKey(key);
    const len = dist(nodes[from], nodes[to]);
    // Conductance inversely proportional to length (longer = lower conductance)
    const conductance = 1 / (len + 0.01);
    const idx = edges.length;
    edges.push({
      from,
      to,
      length: len,
      conductance,
      flow: 0,
      failed: false,
      operational: true,
    });
    adjacency.get(from)!.push({ to, edgeIndex: idx });
    adjacency.get(to)!.push({ to: from, edgeIndex: idx });
  }

  return { nodes, edges, adjacency };
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function parseEdgeKey(key: string): [number, number] {
  const [a, b] = key.split('-').map(Number);
  return [a, b];
}

/**
 * Deep clone a graph for independent simulation of different strategies.
 */
export function cloneGraph(g: Graph): Graph {
  return {
    nodes: g.nodes.map((n) => ({ ...n })),
    edges: g.edges.map((e) => ({ ...e })),
    adjacency: new Map(
      [...g.adjacency.entries()].map(([k, v]) => [
        k,
        v.map((x) => ({ ...x })),
      ]),
    ),
  };
}

/**
 * Mark a node as failed: set failed flag and disable all its edges.
 */
export function failNode(graph: Graph, nodeId: number): void {
  const node = graph.nodes[nodeId];
  if (!node) return;
  node.failed = true;
  for (const { edgeIndex } of graph.adjacency.get(nodeId) ?? []) {
    graph.edges[edgeIndex].failed = true;
    graph.edges[edgeIndex].operational = false;
    graph.edges[edgeIndex].flow = 0;
    graph.edges[edgeIndex].conductance = 0;
  }
}

/**
 * Mark an edge as failed.
 */
export function failEdge(graph: Graph, edgeIndex: number): void {
  const edge = graph.edges[edgeIndex];
  if (!edge) return;
  edge.failed = true;
  edge.operational = false;
  edge.flow = 0;
  edge.conductance = 0;
}

/**
 * Recompute isolated status: a node is isolated if it has no operational edges.
 */
export function recomputeIsolated(graph: Graph): void {
  for (const node of graph.nodes) {
    if (node.failed) {
      node.isolated = true;
      continue;
    }
    const neighbors = graph.adjacency.get(node.id) ?? [];
    node.isolated = !neighbors.some(({ edgeIndex }) => graph.edges[edgeIndex].operational);
  }
}

/**
 * Get the other endpoint of an edge.
 */
export function otherEnd(edge: SimEdge, from: number): number {
  return edge.from === from ? edge.to : edge.from;
}
