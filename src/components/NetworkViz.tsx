import { useRef, useState, useCallback, useEffect } from 'react';
import type { Graph } from '@/sim/graph';
import type { SimRunConfig } from '@/sim/types';

interface NetworkVizProps {
  graph: Graph;
  path: number[];
  source: number;
  destination: number;
  config: SimRunConfig;
  showAnimation: boolean;
  animationStep: number;
  strategy: 'conventional' | 'adaptive';
  failedNodes: Set<number>;
  failedEdges: Set<number>;
  isolatedNodes: Set<number>;
  disrupted: boolean;
}

interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
}

interface NodeInspector {
  id: number;
  status: 'operational' | 'failed' | 'isolated' | 'source' | 'destination';
  connectionCount: number;
  edges: { to: number; conductance: number; flow: number; operational: boolean }[];
}

const NODE_RADIUS = 14;
const PADDING = 40;

export function NetworkViz({
  graph,
  path,
  source,
  destination,
  showAnimation,
  animationStep,
  strategy,
  failedNodes,
  failedEdges,
  isolatedNodes,
  disrupted,
}: NetworkVizProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<ViewState>({ zoom: 1, panX: 0, panY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [inspectedNode, setInspectedNode] = useState<NodeInspector | null>(null);
  const [packetPos, setPacketPos] = useState(0);

  // Packet animation
  useEffect(() => {
    if (!showAnimation || path.length < 2) {
      setPacketPos(0);
      return;
    }
    const interval = setInterval(() => {
      setPacketPos((p) => (p + 0.02) % (path.length - 1));
    }, 50);
    return () => clearInterval(interval);
  }, [showAnimation, path.length]);

  const width = 800;
  const height = 600;

  const toScreenX = (x: number) => PADDING + x * (width - 2 * PADDING);
  const toScreenY = (y: number) => PADDING + y * (height - 2 * PADDING);

  const pathSet = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const a = Math.min(path[i], path[i + 1]);
    const b = Math.max(path[i], path[i + 1]);
    pathSet.add(`${a}-${b}`);
  }

  const maxConductance = Math.max(
    ...graph.edges.map((e) => (e.operational ? e.conductance : 0)),
    0.001,
  );

  const getEdgeWidth = (conductance: number, operational: boolean) => {
    if (!operational) return 1;
    return 1 + (conductance / maxConductance) * 4;
  };

  const getEdgeColor = (edgeIdx: number, fromId: number, toId: number) => {
    const edge = graph.edges[edgeIdx];
    if (!edge.operational) return '#3D2D35';
    const key = `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`;
    if (pathSet.has(key)) return '#78DCE8';
    if (strategy === 'adaptive') {
      const intensity = Math.min(1, Math.abs(edge.flow) / (maxConductance * 0.5 + 0.001));
      return `rgba(53, 198, 176, ${0.3 + intensity * 0.5})`;
    }
    return 'rgba(168, 182, 200, 0.25)';
  };

  const getNodeColor = (id: number) => {
    if (id === source) return '#35C6B0';
    if (id === destination) return '#78DCE8';
    if (failedNodes.has(id)) return '#EF6B6B';
    if (isolatedNodes.has(id)) return '#F5B955';
    return '#A8B6C8';
  };

  const getNodeShape = (id: number) => {
    if (id === source || id === destination) return 'square';
    if (failedNodes.has(id)) return 'diamond';
    return 'circle';
  };

  const handleNodeClick = useCallback(
    (id: number) => {
      const node = graph.nodes[id];
      if (!node) return;
      const neighborEdges = graph.adjacency.get(id) ?? [];
      const edges = neighborEdges.map(({ to, edgeIndex }) => ({
        to,
        conductance: graph.edges[edgeIndex].conductance,
        flow: graph.edges[edgeIndex].flow,
        operational: graph.edges[edgeIndex].operational,
      }));
      let status: NodeInspector['status'] = 'operational';
      if (id === source) status = 'source';
      else if (id === destination) status = 'destination';
      else if (failedNodes.has(id)) status = 'failed';
      else if (isolatedNodes.has(id)) status = 'isolated';
      setInspectedNode({
        id,
        status,
        connectionCount: edges.filter((e) => e.operational).length,
        edges,
      });
    },
    [graph, failedNodes, isolatedNodes, source, destination],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, panX: view.panX, panY: view.panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setView((v) => ({
        ...v,
        panX: panStart.panX + (e.clientX - panStart.x),
        panY: panStart.panY + (e.clientY - panStart.y),
      }));
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => ({
      ...v,
      zoom: Math.max(0.3, Math.min(5, v.zoom * delta)),
    }));
  };

  const resetView = () => setView({ zoom: 1, panX: 0, panY: 0 });

  // Packet position along path
  const packetIdx = Math.floor(packetPos);
  const packetFrac = packetPos - packetIdx;
  let packetX = 0;
  let packetY = 0;
  if (showAnimation && path.length >= 2 && packetIdx < path.length - 1) {
    const n1 = graph.nodes[path[packetIdx]];
    const n2 = graph.nodes[path[packetIdx + 1]];
    if (n1 && n2) {
      packetX = toScreenX(n1.x) + (toScreenX(n2.x) - toScreenX(n1.x)) * packetFrac;
      packetY = toScreenY(n1.y) + (toScreenY(n2.y) - toScreenY(n1.y)) * packetFrac;
    }
  }

  const renderNodeShape = (id: number, cx: number, cy: number) => {
    const shape = getNodeShape(id);
    const color = getNodeColor(id);
    const r = NODE_RADIUS;
    const isOnPath = path.includes(id);
    const glowClass = isOnPath ? 'bioluminescent' : '';
    const isSourceOrDest = id === source || id === destination;

    if (shape === 'square') {
      return (
        <rect
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx={4}
          fill={color}
          className={glowClass}
          stroke={isSourceOrDest ? '#F3F7FA' : 'none'}
          strokeWidth={isSourceOrDest ? 2 : 0}
        />
      );
    }
    if (shape === 'diamond') {
      return (
        <polygon
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          fill={color}
          stroke="#3D2D35"
          strokeWidth={1}
        />
      );
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        className={isOnPath ? glowClass : ''}
        stroke={isOnPath ? '#35C6B0' : 'none'}
        strokeWidth={isOnPath ? 1.5 : 0}
      />
    );
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-grab"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        role="img"
        aria-label="Network visualization showing nodes and connections"
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(53, 198, 176, 0.4)" />
            <stop offset="100%" stopColor="rgba(53, 198, 176, 0)" />
          </radialGradient>
          <filter id="bioluminescence">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          transform={`translate(${view.panX}, ${view.panY}) scale(${view.zoom})`}
        >
          {/* Edges */}
          {graph.edges.map((edge, idx) => {
            const n1 = graph.nodes[edge.from];
            const n2 = graph.nodes[edge.to];
            if (!n1 || !n2) return null;
            const x1 = toScreenX(n1.x);
            const y1 = toScreenY(n1.y);
            const x2 = toScreenX(n2.x);
            const y2 = toScreenY(n2.y);
            const color = getEdgeColor(idx, edge.from, edge.to);
            const width = getEdgeWidth(edge.conductance, edge.operational);
            const isOnPath = pathSet.has(
              `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`,
            );

            return (
              <line
                key={`edge-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={width}
                strokeDasharray={edge.operational ? undefined : '4 4'}
                className={isOnPath ? 'bioluminescent-cyan' : ''}
                style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const cx = toScreenX(node.x);
            const cy = toScreenY(node.y);
            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer"
                onClick={() => handleNodeClick(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNodeClick(node.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Node ${node.id}, ${getNodeColor(node.id) === '#EF6B6B' ? 'failed' : 'operational'}`}
              >
                {/* Glow for source/destination */}
                {(node.id === source || node.id === destination) && (
                  <circle cx={cx} cy={cy} r={NODE_RADIUS + 8} fill="url(#nodeGlow)" />
                )}
                {renderNodeShape(node.id, cx, cy)}
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#0B1220"
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {node.id}
                </text>
              </g>
            );
          })}

          {/* Animated packet */}
          {showAnimation && path.length >= 2 && packetIdx < path.length - 1 && (
            <circle
              cx={packetX}
              cy={packetY}
              r={5}
              fill="#9BEDD5"
              className="bioluminescent"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Source/Destination labels */}
          {graph.nodes[source] && (
            <text
              x={toScreenX(graph.nodes[source].x)}
              y={toScreenY(graph.nodes[source].y) - NODE_RADIUS - 6}
              textAnchor="middle"
              fontSize={11}
              fill="#35C6B0"
              fontWeight={600}
              pointerEvents="none"
            >
              SOURCE
            </text>
          )}
          {graph.nodes[destination] && (
            <text
              x={toScreenX(graph.nodes[destination].x)}
              y={toScreenY(graph.nodes[destination].y) - NODE_RADIUS - 6}
              textAnchor="middle"
              fontSize={11}
              fill="#78DCE8"
              fontWeight={600}
              pointerEvents="none"
            >
              DEST
            </text>
          )}
        </g>
      </svg>

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button
          onClick={() => setView((v) => ({ ...v, zoom: Math.min(5, v.zoom * 1.25) }))}
          className="w-8 h-8 rounded-lg bg-spore-surface border border-spore-border text-spore-text hover:bg-spore-surface-light transition flex items-center justify-center"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.3, v.zoom * 0.8) }))}
          className="w-8 h-8 rounded-lg bg-spore-surface border border-spore-border text-spore-text hover:bg-spore-surface-light transition flex items-center justify-center"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg bg-spore-surface border border-spore-border text-spore-text hover:bg-spore-surface-light transition flex items-center justify-center text-xs"
          aria-label="Reset view"
          title="Reset view"
        >
          ⟲
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-spore-surface/90 backdrop-blur rounded-lg border border-spore-border p-3 text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-spore-teal" /> Source node
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-spore-cyan" /> Destination node
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-spore-muted" /> Operational node
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-spore-error" style={{ transform: 'rotate(45deg)' }} /> Failed node
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-spore-warning" /> Isolated node
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-spore-border">
          <div className="w-6 h-0.5 bg-spore-cyan" /> Active route
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-spore-teal" /> Operational edge
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-red-900" style={{ borderTop: '1px dashed' }} /> Failed edge
        </div>
      </div>

      {/* Node inspector */}
      {inspectedNode && (
        <div className="absolute top-3 left-3 bg-spore-surface/95 backdrop-blur rounded-lg border border-spore-border p-4 text-xs max-w-xs animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-display font-semibold text-spore-text text-sm">
              Node {inspectedNode.id}
            </h4>
            <button
              onClick={() => setInspectedNode(null)}
              className="text-spore-dim hover:text-spore-text"
              aria-label="Close inspector"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-spore-muted">
            <div>
              <span className="text-spore-dim">Status:</span>{' '}
              <span className={
                inspectedNode.status === 'failed' ? 'text-spore-error' :
                inspectedNode.status === 'isolated' ? 'text-spore-warning' :
                inspectedNode.status === 'source' ? 'text-spore-teal' :
                inspectedNode.status === 'destination' ? 'text-spore-cyan' :
                'text-spore-success'
              }>
                {inspectedNode.status}
              </span>
            </div>
            <div>
              <span className="text-spore-dim">Active connections:</span> {inspectedNode.connectionCount}
            </div>
            <div className="pt-1">
              <span className="text-spore-dim">Edges:</span>
              <div className="mt-1 max-h-32 overflow-y-auto space-y-0.5">
                {inspectedNode.edges.map((e, i) => (
                  <div key={i} className="flex justify-between">
                    <span>→ {e.to}</span>
                    <span className={e.operational ? 'text-spore-teal' : 'text-spore-error'}>
                      D={e.conductance.toFixed(4)}
                      {strategy === 'adaptive' && e.operational ? ` Q=${e.flow.toFixed(4)}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disruption indicator */}
      {disrupted && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-spore-error/20 border border-spore-error/40 rounded-lg px-3 py-1.5 text-xs text-spore-error font-medium animate-fade-in">
          Disruption active
        </div>
      )}
    </div>
  );
}
