import type { Graph } from './graph';

export interface PathResult {
  path: number[];
  cost: number;
  hops: number;
  reachable: boolean;
}

/**
 * Dijkstra's shortest path algorithm using a binary-heap priority queue.
 * Edge weight = transmission cost = 1 / conductance (= length for baseline).
 * Failed nodes and failed edges are excluded.
 */
export function dijkstra(
  graph: Graph,
  source: number,
  destination: number,
): PathResult {
  if (source === destination) {
    return { path: [source], cost: 0, hops: 0, reachable: true };
  }

  const n = graph.nodes.length;
  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  dist[source] = 0;

  const visited = new Set<number>();
  const heap = new MinHeap();
  heap.push(source, 0);

  while (heap.size > 0) {
    const { node: u } = heap.pop();
    if (visited.has(u)) continue;
    visited.add(u);

    if (u === destination) break;

    const nodeU = graph.nodes[u];
    if (nodeU.failed) continue;

    const neighbors = graph.adjacency.get(u) ?? [];
    for (const { to, edgeIndex } of neighbors) {
      const edge = graph.edges[edgeIndex];
      if (!edge.operational) continue;
      const nodeV = graph.nodes[to];
      if (nodeV.failed) continue;

      // Weight = length / conductance (transmission cost)
      const weight = edge.length / Math.max(edge.conductance, 1e-9);
      const alt = dist[u] + weight;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
        heap.push(to, alt);
      }
    }
  }

  if (dist[destination] === Infinity) {
    return { path: [], cost: Infinity, hops: 0, reachable: false };
  }

  // Reconstruct path
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
 * Binary min-heap for Dijkstra.
 */
class MinHeap {
  private nodes: number[] = [];
  private priorities: number[] = [];

  get size(): number {
    return this.nodes.length;
  }

  push(node: number, priority: number): void {
    this.nodes.push(node);
    this.priorities.push(priority);
    this.bubbleUp(this.nodes.length - 1);
  }

  pop(): { node: number; priority: number } {
    const top = { node: this.nodes[0], priority: this.priorities[0] };
    const last = this.nodes.length - 1;
    this.nodes[0] = this.nodes[last];
    this.priorities[0] = this.priorities[last];
    this.nodes.pop();
    this.priorities.pop();
    if (this.nodes.length > 0) this.bubbleDown(0);
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.priorities[i] < this.priorities[parent]) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.nodes.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && this.priorities[left] < this.priorities[smallest]) smallest = left;
      if (right < n && this.priorities[right] < this.priorities[smallest]) smallest = right;
      if (smallest !== i) {
        this.swap(i, smallest);
        i = smallest;
      } else break;
    }
  }

  private swap(a: number, b: number): void {
    [this.nodes[a], this.nodes[b]] = [this.nodes[b], this.nodes[a]];
    [this.priorities[a], this.priorities[b]] = [this.priorities[b], this.priorities[a]];
  }
}
