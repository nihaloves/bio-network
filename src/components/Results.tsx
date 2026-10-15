import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Trash2,
  Download,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  X,
  ArrowLeft,
} from 'lucide-react';
import {
  listExperiments,
  getExperiment,
  deleteExperiment,
  resultToCSV,
  type SavedExperiment,
} from '@/lib/data';
import type { SimulationResult } from '@/sim/types';

export function Results() {
  const [experiments, setExperiments] = useState<SavedExperiment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedExperiment | null>(null);
  const [compareList, setCompareList] = useState<SavedExperiment[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const pageSize = 10;

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listExperiments(page, pageSize);
    if ('error' in result) {
      setError(result.error);
    } else {
      setExperiments(result.data);
      setTotal(result.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const handleDelete = async (id: string) => {
    const result = await deleteExperiment(id);
    if ('error' in result) {
      setError(result.error);
    } else {
      setDeleteConfirm(null);
      loadExperiments();
    }
  };

  const handleExport = (exp: SavedExperiment, format: 'json' | 'csv') => {
    const result = exp.result as SimulationResult;
    let content: string;
    let filename: string;
    let mime: string;

    if (format === 'json') {
      content = JSON.stringify(result, null, 2);
      filename = `spore-net-${exp.id}.json`;
      mime = 'application/json';
    } else {
      content = resultToCSV(result);
      filename = `spore-net-${exp.id}.csv`;
      mime = 'text/csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCompare = (exp: SavedExperiment) => {
    setCompareList((prev) => {
      const exists = prev.find((e) => e.id === exp.id);
      if (exists) return prev.filter((e) => e.id !== exp.id);
      if (prev.length >= 4) return prev;
      return [...prev, exp];
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  if (selected) {
    return <DetailView experiment={selected} onBack={() => setSelected(null)} onExport={handleExport} />;
  }

  if (showCompare && compareList.length >= 2) {
    return (
      <CompareView
        experiments={compareList}
        onBack={() => setShowCompare(false)}
      />
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-spore-teal mb-2">
          <FlaskConical size={20} />
          <h1 className="font-display text-2xl font-bold text-spore-text">Results & Experiments</h1>
        </div>
        <p className="text-sm text-spore-muted">
          Browse saved experiments. All data is stored in the database and persists across sessions.
        </p>
      </div>

      {/* Compare bar */}
      {compareList.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-spore-surface border border-spore-teal/30 p-4">
          <span className="text-sm text-spore-muted">
            {compareList.length} experiment(s) selected for comparison
            {compareList.length < 2 && ' — select at least 2'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCompareList([]);
                setShowCompare(false);
              }}
              className="px-3 py-1.5 rounded-lg text-sm text-spore-muted hover:text-spore-text"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCompare(true)}
              disabled={compareList.length < 2}
              className="px-4 py-1.5 rounded-lg bg-spore-teal text-spore-bg text-sm font-semibold disabled:opacity-50"
            >
              Compare
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-spore-error/10 border border-spore-error/30 text-sm text-spore-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-spore-teal animate-spin" />
        </div>
      ) : experiments.length === 0 ? (
        <div className="rounded-xl bg-spore-surface border border-spore-border p-12 text-center">
          <FlaskConical className="w-12 h-12 text-spore-dim mx-auto mb-4" />
          <h3 className="font-display font-semibold text-spore-text mb-2">No experiments yet</h3>
          <p className="text-sm text-spore-muted">
            Run a simulation and save it to see results here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {experiments.map((exp) => {
              const result = exp.result as SimulationResult;
              const convFinal = result.conventional.steps[result.conventional.steps.length - 1];
              const adaptFinal = result.adaptive.steps[result.adaptive.steps.length - 1];
              const isSelected = compareList.some((e) => e.id === exp.id);

              return (
                <div
                  key={exp.id}
                  className="rounded-xl bg-spore-surface border border-spore-border p-4 hover:border-spore-teal/30 transition"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompare(exp)}
                          className="accent-spore-teal"
                          aria-label="Select for comparison"
                        />
                        <h3 className="font-display font-semibold text-spore-text text-sm">
                          {exp.name || `Experiment ${exp.id.slice(0, 8)}`}
                        </h3>
                      </div>
                      <div className="text-xs text-spore-muted space-y-0.5">
                        <div>
                          Nodes: {exp.config.nodeCount} | Density: {exp.config.density} | Seed: {exp.config.seed} |
                          {' '}Packets: {exp.config.packetCount}
                        </div>
                        <div>
                          Disruption: {exp.config.disruptionType} ({exp.config.disruptionSeverity}%)
                        </div>
                        <div className="flex gap-4 mt-1">
                          <span className="text-spore-cyan">
                            Conv delivery: {(convFinal.deliveryRate * 100).toFixed(0)}%
                          </span>
                          <span className="text-spore-teal">
                            Adapt delivery: {(adaptFinal.deliveryRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(exp)}
                        className="px-3 py-1.5 rounded-lg bg-spore-surface-light text-spore-text text-xs font-medium hover:bg-spore-border transition flex items-center gap-1"
                      >
                        View
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => handleExport(exp, 'json')}
                        className="p-1.5 rounded-lg bg-spore-surface-light text-spore-muted hover:text-spore-text transition"
                        title="Export JSON"
                      >
                        <FileJson size={16} />
                      </button>
                      <button
                        onClick={() => handleExport(exp, 'csv')}
                        className="p-1.5 rounded-lg bg-spore-surface-light text-spore-muted hover:text-spore-text transition"
                        title="Export CSV"
                      >
                        <FileSpreadsheet size={16} />
                      </button>
                      {deleteConfirm === exp.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="px-2 py-1 rounded-lg bg-spore-error text-white text-xs font-medium"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 rounded-lg text-spore-muted text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(exp.id)}
                          className="p-1.5 rounded-lg bg-spore-surface-light text-spore-muted hover:text-spore-error transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-spore-dim mt-2">
                    {new Date(exp.created_at).toLocaleString()} | Algorithm: {exp.algorithm_version}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-spore-surface border border-spore-border text-sm text-spore-text disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-spore-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-spore-surface border border-spore-border text-sm text-spore-text disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Access policy notice */}
      <div className="mt-8 rounded-xl bg-spore-surface border border-spore-border p-4">
        <h3 className="text-xs font-semibold text-spore-text mb-1">Access policy</h3>
        <p className="text-xs text-spore-muted leading-relaxed">
          This is a public demo without user accounts. All saved experiments are visible
          to all visitors, and any visitor can delete any experiment. This is intentional
          for a hackathon demonstration. A production deployment would add user
          authentication and per-user access control.
        </p>
      </div>
    </div>
  );
}

function DetailView({
  experiment,
  onBack,
  onExport,
}: {
  experiment: SavedExperiment;
  onBack: () => void;
  onExport: (exp: SavedExperiment, format: 'json' | 'csv') => void;
}) {
  const result = experiment.result as SimulationResult;
  const conv = result.conventional;
  const adapt = result.adaptive;
  const convFinal = conv.steps[conv.steps.length - 1];
  const adaptFinal = adapt.steps[adapt.steps.length - 1];

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-spore-muted hover:text-spore-text mb-4"
      >
        <ArrowLeft size={16} />
        Back to list
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-spore-text">
          {experiment.name || `Experiment ${experiment.id.slice(0, 8)}`}
        </h1>
        <p className="text-xs text-spore-dim mt-1">
          {new Date(experiment.created_at).toLocaleString()} | Algorithm: {experiment.algorithm_version}
        </p>
      </div>

      {/* Config */}
      <div className="rounded-xl bg-spore-surface border border-spore-border p-4 mb-4">
        <h3 className="font-display font-semibold text-spore-text text-sm mb-3">Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <ConfigItem label="Nodes" value={experiment.config.nodeCount} />
          <ConfigItem label="Density" value={experiment.config.density} />
          <ConfigItem label="Seed" value={experiment.config.seed} />
          <ConfigItem label="Packets" value={experiment.config.packetCount} />
          <ConfigItem label="Source" value={experiment.config.sourceNode} />
          <ConfigItem label="Destination" value={experiment.config.destinationNode} />
          <ConfigItem label="Disruption" value={experiment.config.disruptionType} />
          <ConfigItem label="Severity" value={`${experiment.config.disruptionSeverity}%`} />
        </div>
      </div>

      {/* Disruption info */}
      <div className="rounded-xl bg-spore-surface border border-spore-border p-4 mb-4">
        <h3 className="font-display font-semibold text-spore-text text-sm mb-2">Disruption</h3>
        <p className="text-xs text-spore-muted">{result.disruption.description}</p>
        {result.disruption.affectedNodes.length > 0 && (
          <p className="text-xs text-spore-muted mt-1">
            Affected nodes: {result.disruption.affectedNodes.join(', ')}
          </p>
        )}
        {result.disruption.affectedEdges.length > 0 && (
          <p className="text-xs text-spore-muted mt-1">
            Affected edges: {result.disruption.affectedEdges.length} connection(s)
          </p>
        )}
      </div>

      {/* Results table */}
      <div className="rounded-xl bg-spore-surface border border-spore-border overflow-hidden mb-4">
        <div className="p-4 border-b border-spore-border">
          <h3 className="font-display font-semibold text-spore-text">Final Results</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-spore-border">
              <th className="text-left px-4 py-2 text-spore-muted text-xs font-medium">Metric</th>
              <th className="text-right px-4 py-2 text-spore-muted text-xs font-medium">Conventional</th>
              <th className="text-right px-4 py-2 text-spore-muted text-xs font-medium">Adaptive</th>
            </tr>
          </thead>
          <tbody>
            <ResultRow label="Delivery rate" conv={`${(convFinal.deliveryRate * 100).toFixed(1)}%`} adapt={`${(adaptFinal.deliveryRate * 100).toFixed(1)}%`} />
            <ResultRow label="Packets delivered" conv={convFinal.packetsDelivered} adapt={adaptFinal.packetsDelivered} />
            <ResultRow label="Avg route cost" conv={convFinal.avgRouteCost.toFixed(4)} adapt={adaptFinal.avgRouteCost.toFixed(4)} />
            <ResultRow label="Avg hop count" conv={convFinal.avgHopCount} adapt={adaptFinal.avgHopCount} />
            <ResultRow label="Operational edges" conv={convFinal.operationalEdges} adapt={adaptFinal.operationalEdges} />
            <ResultRow label="Connected components" conv={convFinal.connectedComponents} adapt={adaptFinal.connectedComponents} />
            <ResultRow label="Recovery step" conv={conv.recoveryStep ?? 'No recovery'} adapt={adapt.recoveryStep ?? 'No recovery'} />
            <ResultRow label="Execution (ms)" conv={conv.executionMs.toFixed(1)} adapt={adapt.executionMs.toFixed(1)} />
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <DeliveryChart result={result} />

      {/* Export buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onExport(experiment, 'json')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spore-surface border border-spore-border text-spore-text text-sm hover:bg-spore-surface-light transition"
        >
          <Download size={16} />
          Export JSON
        </button>
        <button
          onClick={() => onExport(experiment, 'csv')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spore-surface border border-spore-border text-spore-text text-sm hover:bg-spore-surface-light transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
    </div>
  );
}

function CompareView({ experiments, onBack }: { experiments: SavedExperiment[]; onBack: () => void }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-spore-muted hover:text-spore-text mb-4"
      >
        <ArrowLeft size={16} />
        Back to list
      </button>

      <h1 className="font-display text-2xl font-bold text-spore-text mb-6">Compare Experiments</h1>

      <div className="overflow-x-auto rounded-xl bg-spore-surface border border-spore-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-spore-border">
              <th className="text-left px-4 py-3 text-spore-muted text-xs font-medium">Metric</th>
              {experiments.map((exp) => (
                <th key={exp.id} className="text-right px-4 py-3 text-spore-muted text-xs font-medium">
                  {exp.name || exp.id.slice(0, 8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow
              label="Nodes"
              experiments={experiments}
              getValue={(e) => e.config.nodeCount}
            />
            <CompareRow
              label="Density"
              experiments={experiments}
              getValue={(e) => e.config.density}
            />
            <CompareRow
              label="Seed"
              experiments={experiments}
              getValue={(e) => e.config.seed}
            />
            <CompareRow
              label="Disruption"
              experiments={experiments}
              getValue={(e) => e.config.disruptionType}
            />
            <CompareRow
              label="Conv delivery rate"
              experiments={experiments}
              getValue={(e) => {
                const r = e.result as SimulationResult;
                const f = r.conventional.steps[r.conventional.steps.length - 1];
                return `${(f.deliveryRate * 100).toFixed(1)}%`;
              }}
            />
            <CompareRow
              label="Adapt delivery rate"
              experiments={experiments}
              getValue={(e) => {
                const r = e.result as SimulationResult;
                const f = r.adaptive.steps[r.adaptive.steps.length - 1];
                return `${(f.deliveryRate * 100).toFixed(1)}%`;
              }}
            />
            <CompareRow
              label="Conv hop count"
              experiments={experiments}
              getValue={(e) => {
                const r = e.result as SimulationResult;
                const f = r.conventional.steps[r.conventional.steps.length - 1];
                return f.avgHopCount;
              }}
            />
            <CompareRow
              label="Adapt hop count"
              experiments={experiments}
              getValue={(e) => {
                const r = e.result as SimulationResult;
                const f = r.adaptive.steps[r.adaptive.steps.length - 1];
                return f.avgHopCount;
              }}
            />
            <CompareRow
              label="Adaptive recovery step"
              experiments={experiments}
              getValue={(e) => {
                const r = e.result as SimulationResult;
                return r.adaptive.recoveryStep ?? 'No recovery';
              }}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeliveryChart({ result }: { result: SimulationResult }) {
  const convSteps = result.conventional.steps;
  const adaptSteps = result.adaptive.steps;
  const maxLen = Math.max(convSteps.length, adaptSteps.length);

  const width = 700;
  const height = 200;
  const padding = 40;

  const toX = (i: number) => padding + (i / Math.max(maxLen - 1, 1)) * (width - 2 * padding);
  const toY = (rate: number) => height - padding - rate * (height - 2 * padding);

  const convPath = convSteps.map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(s.deliveryRate)}`).join(' ');
  const adaptPath = adaptSteps.map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(s.deliveryRate)}`).join(' ');

  return (
    <div className="rounded-xl bg-spore-surface border border-spore-border p-4 mb-4">
      <h3 className="font-display font-semibold text-spore-text text-sm mb-3">Delivery Rate Over Steps</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={padding} y1={toY(v)} x2={width - padding} y2={toY(v)} stroke="rgba(168, 182, 200, 0.1)" />
            <text x={padding - 8} y={toY(v) + 4} textAnchor="end" fontSize={10} fill="#A8B6C8">
              {(v * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        {/* X axis label */}
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#A8B6C8">Step</text>

        {/* Conventional line */}
        <path d={convPath} fill="none" stroke="#78DCE8" strokeWidth={2} />
        {/* Adaptive line */}
        <path d={adaptPath} fill="none" stroke="#35C6B0" strokeWidth={2} />

        {/* Legend */}
        <line x1={width - 120} y1={20} x2={width - 100} y2={20} stroke="#78DCE8" strokeWidth={2} />
        <text x={width - 95} y={24} fontSize={10} fill="#A8B6C8">Conventional</text>
        <line x1={width - 120} y1={36} x2={width - 100} y2={36} stroke="#35C6B0" strokeWidth={2} />
        <text x={width - 95} y={40} fontSize={10} fill="#A8B6C8">Adaptive</text>
      </svg>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-spore-dim">{label}:</span>{' '}
      <span className="text-spore-text font-mono">{value}</span>
    </div>
  );
}

function ResultRow({ label, conv, adapt }: { label: string; conv: string | number; adapt: string | number }) {
  return (
    <tr className="border-b border-spore-border/50 last:border-0">
      <td className="px-4 py-2.5 text-spore-muted text-xs">{label}</td>
      <td className="px-4 py-2.5 text-right font-mono text-spore-text text-xs">{conv}</td>
      <td className="px-4 py-2.5 text-right font-mono text-spore-teal text-xs">{adapt}</td>
    </tr>
  );
}

function CompareRow({
  label,
  experiments,
  getValue,
}: {
  label: string;
  experiments: SavedExperiment[];
  getValue: (e: SavedExperiment) => string | number;
}) {
  return (
    <tr className="border-b border-spore-border/50 last:border-0">
      <td className="px-4 py-2.5 text-spore-muted text-xs">{label}</td>
      {experiments.map((exp) => (
        <td key={exp.id} className="px-4 py-2.5 text-right font-mono text-spore-text text-xs">
          {getValue(exp)}
        </td>
      ))}
    </tr>
  );
}
