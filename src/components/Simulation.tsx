import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Loader2,
  AlertCircle,
  Settings,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { generateGraph, cloneGraph, failNode, failEdge, recomputeIsolated } from '@/sim/graph';
import type { Graph } from '@/sim/graph';
import { dijkstra } from '@/sim/dijkstra';
import { physarumStep, conductanceRoute, DEFAULT_PHYSARUM_PARAMS } from '@/sim/physarum';
import { applyDisruption } from '@/sim/disruption';
import { validateConfig } from '@/sim/validation';
import { runSimulation } from '@/sim/engine';
import { computeMetrics } from '@/sim/types';
import type { SimRunConfig, SimulationResult, DisruptionType, Density, RoutingStrategy } from '@/sim/types';
import { saveExperiment } from '@/lib/data';
import { NetworkViz } from './NetworkViz';

const DEFAULT_CONFIG: SimRunConfig = {
  nodeCount: 40,
  density: 'balanced',
  seed: 42,
  sourceNode: 0,
  destinationNode: 39,
  packetCount: 100,
  disruptionType: 'connection-failure',
  disruptionSeverity: 30,
  disruptionSeed: 100,
  strategy: 'compare',
  maxSteps: 25,
};

export function Simulation() {
  const [config, setConfig] = useState<SimRunConfig>(DEFAULT_CONFIG);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [graph, setGraph] = useState<Graph | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [animating, setAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [showStrategy, setShowStrategy] = useState<'conventional' | 'adaptive'>('adaptive');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [experimentName, setExperimentName] = useState('');
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate initial network when node count or seed changes
  const generateNetwork = useCallback(() => {
    const validationErrors = validateConfig(config);
    const fieldErrors: Record<string, string> = {};
    for (const err of validationErrors) {
      if (!fieldErrors[err.field]) fieldErrors[err.field] = err.message;
    }
    setErrors(fieldErrors);
    if (validationErrors.length > 0) return;

    const g = generateGraph({
      nodeCount: config.nodeCount,
      density: config.density,
      seed: config.seed,
    });
    setGraph(g);
    setResult(null);
    setAnimating(false);
    setAnimationStep(0);
  }, [config]);

  // Auto-generate on first load
  useEffect(() => {
    generateNetwork();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateConfig = (patch: Partial<SimRunConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setResult(null);
  };

  const handleRun = useCallback(async () => {
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      const fieldErrors: Record<string, string> = {};
      for (const err of validationErrors) {
        if (!fieldErrors[err.field]) fieldErrors[err.field] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setIsRunning(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 95));
    }, 80);

    try {
      // Small delay to let UI update
      await new Promise((r) => setTimeout(r, 50));
      const res = runSimulation(config);
      setResult(res);
      setProgress(100);

      // Update visualization with the strategy being shown
      const strategyResult = showStrategy === 'conventional' ? res.conventional : res.adaptive;
      // Rebuild graph state for visualization
      const baseGraph = generateGraph({
        nodeCount: config.nodeCount,
        density: config.density,
        seed: config.seed,
      });
      const vizGraph = cloneGraph(baseGraph);
      applyDisruption(
        vizGraph,
        { type: config.disruptionType, severity: config.disruptionSeverity, seed: config.disruptionSeed },
        config.sourceNode,
        config.destinationNode,
      );

      // If adaptive, run adaptation steps to show final state
      if (showStrategy === 'adaptive') {
        for (let i = 0; i < config.maxSteps; i++) {
          physarumStep(vizGraph, config.sourceNode, config.destinationNode, 1.0, DEFAULT_PHYSARUM_PARAMS);
        }
      }

      setGraph(vizGraph);
      setAnimationStep(0);
      setAnimating(true);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Simulation failed.' });
    } finally {
      clearInterval(progressInterval);
      setIsRunning(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [config, showStrategy]);

  // Animation stepping
  useEffect(() => {
    if (!animating || !result) return;

    const strategySteps =
      showStrategy === 'conventional' ? result.conventional.steps : result.adaptive.steps;

    stepTimerRef.current = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= strategySteps.length - 1) {
          setAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [animating, result, showStrategy]);

  const handlePause = () => {
    setAnimating(false);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  };

  const handleResume = () => {
    if (!result) return;
    const strategySteps =
      showStrategy === 'conventional' ? result.conventional.steps : result.adaptive.steps;
    if (animationStep < strategySteps.length - 1) {
      setAnimating(true);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAnimating(false);
    setAnimationStep(0);
    setSaveStatus('idle');
    setExperimentName('');
    generateNetwork();
  };

  const handleSave = async () => {
    if (!result) return;
    setSaveStatus('saving');
    const res = await saveExperiment(experimentName || null, config, result);
    if ('error' in res) {
      setSaveStatus('error');
      setSaveMessage(res.error);
    } else {
      setSaveStatus('saved');
      setSaveMessage('Experiment saved successfully.');
    }
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 3000);
  };

  // Compute display data
  const strategyResult =
    result && showStrategy === 'conventional' ? result.conventional : result?.adaptive;
  const currentStepData = strategyResult?.steps[Math.min(animationStep, (strategyResult?.steps.length ?? 1) - 1)];

  // Build display graph with disruption applied
  const displayGraph = graph;
  const displayPath = currentStepData?.routePath ?? [];
  const failedNodes = new Set<number>();
  const failedEdges = new Set<number>();
  const isolatedNodes = new Set<number>();

  if (displayGraph) {
    for (const n of displayGraph.nodes) {
      if (n.failed) failedNodes.add(n.id);
      if (n.isolated) isolatedNodes.add(n.id);
    }
    displayGraph.edges.forEach((e, i) => {
      if (e.failed || !e.operational) failedEdges.add(i);
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-spore-text">Run Simulation</h1>
        <p className="text-sm text-spore-muted mt-1">
          Configure a network, inject a disruption, and compare routing strategies.
        </p>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Left: Configuration */}
        <div className="space-y-4">
          {/* Network config */}
          <ConfigSection title="Network Configuration" icon={<Settings size={16} />}>
            <Field label="Number of nodes" error={errors.nodeCount}>
              <input
                type="number"
                min={20}
                max={100}
                value={config.nodeCount}
                onChange={(e) => updateConfig({ nodeCount: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </Field>

            <Field label="Network density">
              <select
                value={config.density}
                onChange={(e) => updateConfig({ density: e.target.value as Density })}
                className="input"
              >
                <option value="sparse">Sparse</option>
                <option value="balanced">Balanced</option>
                <option value="dense">Dense</option>
              </select>
            </Field>

            <Field label="Random seed" error={errors.seed}>
              <input
                type="number"
                min={0}
                value={config.seed}
                onChange={(e) => updateConfig({ seed: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Source node" error={errors.sourceNode}>
                <input
                  type="number"
                  min={0}
                  max={config.nodeCount - 1}
                  value={config.sourceNode}
                  onChange={(e) => updateConfig({ sourceNode: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </Field>

              <Field label="Destination node" error={errors.destinationNode}>
                <input
                  type="number"
                  min={0}
                  max={config.nodeCount - 1}
                  value={config.destinationNode}
                  onChange={(e) => updateConfig({ destinationNode: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Number of packets" error={errors.packetCount}>
              <input
                type="number"
                min={10}
                max={500}
                value={config.packetCount}
                onChange={(e) => updateConfig({ packetCount: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </Field>
          </ConfigSection>

          {/* Disruption config */}
          <ConfigSection title="Disruption Configuration" icon={<Zap size={16} />}>
            <Field label="Disruption type">
              <select
                value={config.disruptionType}
                onChange={(e) => updateConfig({ disruptionType: e.target.value as DisruptionType })}
                className="input"
              >
                <option value="none">No disruption</option>
                <option value="node-failure">Node failure</option>
                <option value="connection-failure">Connection failure</option>
                <option value="increased-cost">Increased transmission cost</option>
                <option value="multiple-failures">Multiple failures</option>
              </select>
            </Field>

            {config.disruptionType !== 'none' && (
              <Field
                label={
                  config.disruptionType === 'increased-cost'
                    ? 'Severity (cost increase %)'
                    : 'Severity (% affected)'
                }
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={config.disruptionSeverity}
                    onChange={(e) => updateConfig({ disruptionSeverity: parseInt(e.target.value) })}
                    className="flex-1 accent-spore-teal"
                  />
                  <span className="text-sm text-spore-text font-mono w-12 text-right">
                    {config.disruptionSeverity}%
                  </span>
                </div>
              </Field>
            )}

            <Field label="Disruption random seed">
              <input
                type="number"
                min={0}
                value={config.disruptionSeed}
                onChange={(e) => updateConfig({ disruptionSeed: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </Field>
          </ConfigSection>

          {/* Routing strategy */}
          <ConfigSection title="Routing Strategy" icon={<Activity size={16} />}>
            <Field label="Strategy">
              <select
                value={config.strategy}
                onChange={(e) => updateConfig({ strategy: e.target.value as RoutingStrategy })}
                className="input"
              >
                <option value="conventional">Conventional shortest-path</option>
                <option value="adaptive">Bio-inspired adaptive</option>
                <option value="compare">Compare both (recommended)</option>
              </select>
            </Field>
            <p className="text-xs text-spore-dim">
              Comparison mode runs both strategies on identical networks with the same
              disruption, ensuring a fair test.
            </p>
          </ConfigSection>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-spore-teal text-spore-bg font-semibold text-sm hover:bg-spore-teal-dim transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run Simulation
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={generateNetwork}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-spore-surface border border-spore-border text-spore-text text-sm font-medium hover:bg-spore-surface-light transition disabled:opacity-50"
              >
                <Settings size={16} />
                Generate
              </button>
              <button
                onClick={handleReset}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-spore-surface border border-spore-border text-spore-text text-sm font-medium hover:bg-spore-surface-light transition disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {result && (
              <>
                <div className="flex gap-2">
                  {animating ? (
                    <button
                      onClick={handlePause}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-spore-surface border border-spore-border text-spore-text text-sm font-medium hover:bg-spore-surface-light transition"
                    >
                      <Pause size={16} />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={handleResume}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-spore-surface border border-spore-border text-spore-text text-sm font-medium hover:bg-spore-surface-light transition"
                    >
                      <Play size={16} />
                      Resume
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-spore-surface border border-spore-border text-spore-text text-sm font-medium hover:bg-spore-surface-light transition disabled:opacity-50"
                  >
                    {saveStatus === 'saving' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : saveStatus === 'saved' ? (
                      <CheckCircle2 size={16} className="text-spore-success" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save
                  </button>
                </div>

                {saveStatus === 'saving' && (
                  <input
                    type="text"
                    placeholder="Experiment name (optional)"
                    value={experimentName}
                    onChange={(e) => setExperimentName(e.target.value)}
                    className="input"
                  />
                )}
                {saveMessage && (
                  <p className={`text-xs ${saveStatus === 'error' ? 'text-spore-error' : 'text-spore-success'}`}>
                    {saveMessage}
                  </p>
                )}
              </>
            )}
          </div>

          {errors.form && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-spore-error/10 border border-spore-error/30 text-sm text-spore-error">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {errors.form}
            </div>
          )}
        </div>

        {/* Right: Visualization + Results */}
        <div className="space-y-4">
          {/* Progress bar */}
          {isRunning && (
            <div className="rounded-xl bg-spore-surface border border-spore-border p-4">
              <div className="flex items-center justify-between text-sm text-spore-muted mb-2">
                <span>Running simulation...</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-spore-bg overflow-hidden">
                <div
                  className="h-full bg-spore-teal transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Strategy selector for comparison */}
          {result && config.strategy === 'compare' && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowStrategy('conventional')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  showStrategy === 'conventional'
                    ? 'bg-spore-teal text-spore-bg'
                    : 'bg-spore-surface border border-spore-border text-spore-muted hover:text-spore-text'
                }`}
              >
                Conventional
              </button>
              <button
                onClick={() => setShowStrategy('adaptive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  showStrategy === 'adaptive'
                    ? 'bg-spore-teal text-spore-bg'
                    : 'bg-spore-surface border border-spore-border text-spore-muted hover:text-spore-text'
                }`}
              >
                Bio-inspired Adaptive
              </button>
            </div>
          )}

          {/* Visualization */}
          {displayGraph ? (
            <div className="rounded-xl bg-spore-surface border border-spore-border overflow-hidden">
              <div className="aspect-[4/3] lg:aspect-[16/10] relative">
                <NetworkViz
                  graph={displayGraph}
                  path={displayPath}
                  source={config.sourceNode}
                  destination={config.destinationNode}
                  config={config}
                  showAnimation={animating}
                  animationStep={animationStep}
                  strategy={showStrategy}
                  failedNodes={failedNodes}
                  failedEdges={failedEdges}
                  isolatedNodes={isolatedNodes}
                  disrupted={config.disruptionType !== 'none'}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-spore-surface border border-spore-border p-12 text-center">
              <p className="text-spore-muted">Generate a network to see the visualization.</p>
            </div>
          )}

          {/* Step indicator */}
          {result && currentStepData && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-spore-muted">
                Step <span className="text-spore-text font-mono font-semibold">{currentStepData.step}</span>{' '}
                / {(strategyResult?.steps.length ?? 1) - 1}
              </span>
              {showStrategy === 'adaptive' && (
                <span className="text-spore-muted">
                  Total conductance:{' '}
                  <span className="text-spore-teal font-mono">
                    {currentStepData.totalConductance.toFixed(4)}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Results comparison */}
          {result && <ResultsComparison result={result} />}

          {/* Event timeline */}
          {result && <EventTimeline result={result} strategy={showStrategy} />}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: var(--spore-bg);
          border: 1px solid var(--spore-border);
          border-radius: 0.5rem;
          color: var(--spore-text);
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: var(--spore-teal);
        }
        .input:hover {
          border-color: var(--spore-dim);
        }
      `}</style>
    </div>
  );
}

function ConfigSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-spore-surface border border-spore-border p-4 space-y-3">
      <div className="flex items-center gap-2 text-spore-teal">
        {icon}
        <h3 className="font-display font-semibold text-sm text-spore-text">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-spore-muted mb-1.5 font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-spore-error mt-1">{error}</p>}
    </div>
  );
}

function ResultsComparison({ result }: { result: SimulationResult }) {
  const conv = result.conventional;
  const adapt = result.adaptive;
  const convFinal = conv.steps[conv.steps.length - 1];
  const adaptFinal = adapt.steps[adapt.steps.length - 1];

  const metrics = [
    {
      label: 'Packets delivered',
      conv: convFinal.packetsDelivered,
      adapt: adaptFinal.packetsDelivered,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Delivery rate',
      conv: convFinal.deliveryRate,
      adapt: adaptFinal.deliveryRate,
      format: (v: number) => `${(v * 100).toFixed(1)}%`,
    },
    {
      label: 'Avg route cost',
      conv: convFinal.avgRouteCost,
      adapt: adaptFinal.avgRouteCost,
      format: (v: number) => v === 0 ? 'N/A' : v.toFixed(4),
    },
    {
      label: 'Avg hop count',
      conv: convFinal.avgHopCount,
      adapt: adaptFinal.avgHopCount,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Operational edges',
      conv: convFinal.operationalEdges,
      adapt: adaptFinal.operationalEdges,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Connected components',
      conv: convFinal.connectedComponents,
      adapt: adaptFinal.connectedComponents,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Recovery step',
      conv: conv.recoveryStep ?? 'No recovery',
      adapt: adapt.recoveryStep ?? 'No recovery',
      format: (v: number | string) => typeof v === 'number' ? v.toString() : v,
    },
    {
      label: 'Execution time (ms)',
      conv: conv.executionMs,
      adapt: adapt.executionMs,
      format: (v: number) => v.toFixed(1),
    },
  ];

  return (
    <div className="rounded-xl bg-spore-surface border border-spore-border overflow-hidden">
      <div className="p-4 border-b border-spore-border">
        <h3 className="font-display font-semibold text-spore-text">Results Comparison</h3>
        <p className="text-xs text-spore-muted mt-1">
          Measured from the simulation engine. No fabricated values.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-spore-border">
              <th className="text-left px-4 py-2 text-spore-muted font-medium text-xs">Metric</th>
              <th className="text-right px-4 py-2 text-spore-muted font-medium text-xs">Conventional</th>
              <th className="text-right px-4 py-2 text-spore-muted font-medium text-xs">Adaptive</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const convVal = m.format(m.conv);
              const adaptVal = m.format(m.adapt);
              const convBetter = typeof m.conv === 'number' && typeof m.adapt === 'number' && m.conv > m.adapt;
              const adaptBetter = typeof m.conv === 'number' && typeof m.adapt === 'number' && m.adapt > m.conv;

              return (
                <tr key={m.label} className="border-b border-spore-border/50 last:border-0">
                  <td className="px-4 py-2.5 text-spore-muted text-xs">{m.label}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-spore-text text-xs">
                    {convVal}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono text-xs ${
                    adaptBetter ? 'text-spore-success' : convBetter ? 'text-spore-error' : 'text-spore-text'
                  }`}>
                    {adaptVal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventTimeline({ result, strategy }: { result: SimulationResult; strategy: 'conventional' | 'adaptive' }) {
  const events = strategy === 'conventional' ? result.conventional.eventLog : result.adaptive.eventLog;

  return (
    <div className="rounded-xl bg-spore-surface border border-spore-border p-4">
      <h3 className="font-display font-semibold text-spore-text mb-3">Event Timeline — {strategy}</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-spore-muted">No events recorded.</p>
        ) : (
          events.map((event, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-xs text-spore-dim w-16 shrink-0 pt-0.5">
                step {event.step}
              </span>
              <div className="flex-1">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  event.type === 'success' ? 'bg-spore-success' :
                  event.type === 'failure' ? 'bg-spore-error' :
                  event.type === 'recovery' ? 'bg-spore-teal' :
                  event.type === 'disruption' ? 'bg-spore-warning' :
                  'bg-spore-dim'
                }`} />
                <span className="text-spore-muted text-xs">{event.message}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
