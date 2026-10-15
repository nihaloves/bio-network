import { useEffect, useRef, useState } from 'react';
import { RNG } from '@/sim/rng';
import { generateGraph } from '@/sim/graph';
import type { Graph } from '@/sim/graph';

/**
 * Decorative animated network preview for the Overview hero.
 * Not the simulation visualization — just a beautiful branching network.
 */
export function PreviewNetwork() {
  const [graph] = useState<Graph>(() =>
    generateGraph({ nodeCount: 35, density: 'balanced', seed: 7 }),
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let frame: number;
    let last = 0;
    const animate = (t: number) => {
      if (t - last > 100) {
        setTick((p) => p + 1);
        last = t;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const size = 500;
  const padding = 30;
  const toX = (x: number) => padding + x * (size - 2 * padding);
  const toY = (y: number) => padding + y * (size - 2 * padding);

  // Highlight a few edges as "active" based on tick
  const activeEdgeCount = 8;
  const rng = new RNG(tick * 17 + 3);
  const activeEdges = new Set<number>();
  for (let i = 0; i < activeEdgeCount; i++) {
    activeEdges.add(rng.nextInt(0, graph.edges.length - 1));
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      role="img"
      aria-label="Preview of a branching adaptive network"
    >
      <defs>
        <filter id="previewGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Edges */}
      {graph.edges.map((edge, idx) => {
        const n1 = graph.nodes[edge.from];
        const n2 = graph.nodes[edge.to];
        if (!n1 || !n2) return null;
        const isActive = activeEdges.has(idx);
        return (
          <line
            key={`p-edge-${idx}`}
            x1={toX(n1.x)}
            y1={toY(n1.y)}
            x2={toX(n2.x)}
            y2={toY(n2.y)}
            stroke={isActive ? '#35C6B0' : 'rgba(168, 182, 200, 0.12)'}
            strokeWidth={isActive ? 1.5 : 0.5}
            className={isActive ? 'bioluminescent' : ''}
            style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
          />
        );
      })}
      {/* Nodes */}
      {graph.nodes.map((node) => {
        const cx = toX(node.x);
        const cy = toY(node.y);
        const isHub = (graph.adjacency.get(node.id) ?? []).length > 4;
        return (
          <circle
            key={`p-node-${node.id}`}
            cx={cx}
            cy={cy}
            r={isHub ? 4 : 2.5}
            fill={isHub ? '#35C6B0' : '#78DCE8'}
            opacity={isHub ? 0.9 : 0.5}
            className={isHub ? 'bioluminescent' : ''}
          />
        );
      })}
    </svg>
  );
}
