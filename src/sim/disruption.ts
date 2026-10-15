import type { Graph } from './graph';
import { failNode, failEdge, recomputeIsolated } from './graph';
import { RNG } from './rng';

export type DisruptionType =
  | 'none'
  | 'node-failure'
  | 'connection-failure'
  | 'increased-cost'
  | 'multiple-failures';

export interface DisruptionConfig {
  type: DisruptionType;
  severity: number; // 0-100, meaning depends on type
  seed: number;
}

export interface DisruptionEvent {
  type: DisruptionType;
  description: string;
  affectedNodes: number[];
  affectedEdges: number[];
  costIncreaseFactor: number;
}

/**
 * Apply a disruption scenario to a graph.
 * Uses a dedicated RNG seeded from the disruption config so the same
 * graph + disruption always produces the same failures.
 */
export function applyDisruption(
  graph: Graph,
  config: DisruptionConfig,
  source: number,
  destination: number,
): DisruptionEvent {
  const rng = new RNG(config.seed);
  const event: DisruptionEvent = {
    type: config.type,
    description: '',
    affectedNodes: [],
    affectedEdges: [],
    costIncreaseFactor: 1,
  };

  if (config.type === 'none') {
    event.description = 'No disruption applied.';
    recomputeIsolated(graph);
    return event;
  }

  // Candidate nodes/edges to fail (exclude source and destination)
  const failableNodes = graph.nodes
    .filter((n) => n.id !== source && n.id !== destination)
    .map((n) => n.id);
  const failableEdges = graph.edges
    .map((_, i) => i)
    .filter((i) => {
      const e = graph.edges[i];
      return e.from !== source && e.to !== source && e.from !== destination && e.to !== destination;
    });

  switch (config.type) {
    case 'node-failure': {
      const count = Math.max(1, Math.round((config.severity / 100) * failableNodes.length));
      const shuffled = rng.shuffle(failableNodes);
      for (let i = 0; i < count && i < shuffled.length; i++) {
        failNode(graph, shuffled[i]);
        event.affectedNodes.push(shuffled[i]);
      }
      event.description = `${event.affectedNodes.length} node(s) failed (${config.severity}% severity).`;
      break;
    }
    case 'connection-failure': {
      const count = Math.max(1, Math.round((config.severity / 100) * failableEdges.length));
      const shuffled = rng.shuffle(failableEdges);
      for (let i = 0; i < count && i < shuffled.length; i++) {
        failEdge(graph, shuffled[i]);
        event.affectedEdges.push(shuffled[i]);
      }
      event.description = `${event.affectedEdges.length} connection(s) failed (${config.severity}% severity).`;
      break;
    }
    case 'increased-cost': {
      const factor = 1 + (config.severity / 100) * 9; // up to 10× cost
      const count = Math.max(1, Math.round((config.severity / 100) * failableEdges.length));
      const shuffled = rng.shuffle(failableEdges);
      for (let i = 0; i < count && i < shuffled.length; i++) {
        const edge = graph.edges[shuffled[i]];
        edge.length *= factor;
        edge.conductance /= factor;
        event.affectedEdges.push(shuffled[i]);
      }
      event.costIncreaseFactor = factor;
      event.description = `${event.affectedEdges.length} connection(s) had transmission cost increased ${factor.toFixed(1)}×.`;
      break;
    }
    case 'multiple-failures': {
      // Combine node failures + connection failures
      const nodeCount = Math.max(1, Math.round((config.severity / 100) * 0.5 * failableNodes.length));
      const edgeCount = Math.max(1, Math.round((config.severity / 100) * 0.3 * failableEdges.length));
      const shuffledNodes = rng.shuffle(failableNodes);
      for (let i = 0; i < nodeCount && i < shuffledNodes.length; i++) {
        failNode(graph, shuffledNodes[i]);
        event.affectedNodes.push(shuffledNodes[i]);
      }
      const shuffledEdges = rng.shuffle(failableEdges).filter(
        (ei) => graph.edges[ei].operational,
      );
      for (let i = 0; i < edgeCount && i < shuffledEdges.length; i++) {
        failEdge(graph, shuffledEdges[i]);
        event.affectedEdges.push(shuffledEdges[i]);
      }
      event.description = `Combined disruption: ${event.affectedNodes.length} node(s) + ${event.affectedEdges.length} connection(s) failed.`;
      break;
    }
  }

  recomputeIsolated(graph);
  return event;
}
