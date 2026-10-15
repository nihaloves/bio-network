import { supabase } from './supabase';
import type { SimulationResult, SimRunConfig } from '@/sim/types';

export interface SavedExperiment {
  id: string;
  name: string | null;
  config: SimRunConfig;
  result: SimulationResult;
  algorithm_version: string;
  created_at: string;
}

/**
 * Save a simulation result to the database.
 */
export async function saveExperiment(
  name: string | null,
  config: SimRunConfig,
  result: SimulationResult,
): Promise<{ id: string } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('experiments')
      .insert({
        name,
        config,
        result,
        algorithm_version: result.algorithmVersion,
      })
      .select('id')
      .single();

    if (error) {
      return { error: error.message };
    }

    return { id: data.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error saving experiment.' };
  }
}

/**
 * List saved experiments (paginated).
 */
export async function listExperiments(
  page: number = 1,
  pageSize: number = 10,
): Promise<{ data: SavedExperiment[]; total: number } | { error: string }> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [listResult, countResult] = await Promise.all([
      supabase
        .from('experiments')
        .select('id, name, config, result, algorithm_version, created_at')
        .order('created_at', { ascending: false })
        .range(from, to),
      supabase.from('experiments').select('id', { count: 'exact', head: true }),
    ]);

    if (listResult.error) return { error: listResult.error.message };
    if (countResult.error) return { error: countResult.error.message };

    return {
      data: (listResult.data ?? []) as SavedExperiment[],
      total: countResult.count ?? 0,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error listing experiments.' };
  }
}

/**
 * Get a single experiment by ID.
 */
export async function getExperiment(
  id: string,
): Promise<SavedExperiment | null | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('id, name, config, result, algorithm_version, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) return { error: error.message };

    return data as SavedExperiment | null;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error fetching experiment.' };
  }
}

/**
 * Delete an experiment by ID.
 */
export async function deleteExperiment(
  id: string,
): Promise<{ success: boolean } | { error: string }> {
  try {
    const { error } = await supabase.from('experiments').delete().eq('id', id);

    if (error) return { error: error.message };

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error deleting experiment.' };
  }
}

/**
 * Convert a simulation result to CSV format.
 */
export function resultToCSV(result: SimulationResult): string {
  const headers = [
    'step',
    'strategy',
    'operational_nodes',
    'failed_nodes',
    'operational_edges',
    'failed_edges',
    'connected_components',
    'packets_delivered',
    'packets_attempted',
    'delivery_rate',
    'avg_route_cost',
    'avg_hop_count',
    'source_connected',
    'destination_connected',
    'total_conductance',
  ];

  const rows: string[] = [headers.join(',')];

  for (const step of result.conventional.steps) {
    rows.push([
      step.step,
      'conventional',
      step.operationalNodes,
      step.failedNodes,
      step.operationalEdges,
      step.failedEdges,
      step.connectedComponents,
      step.packetsDelivered,
      step.packetsAttempted,
      step.deliveryRate.toFixed(6),
      step.avgRouteCost.toFixed(6),
      step.avgHopCount,
      step.sourceConnected,
      step.destinationConnected,
      step.totalConductance.toFixed(6),
    ].join(','));
  }

  for (const step of result.adaptive.steps) {
    rows.push([
      step.step,
      'adaptive',
      step.operationalNodes,
      step.failedNodes,
      step.operationalEdges,
      step.failedEdges,
      step.connectedComponents,
      step.packetsDelivered,
      step.packetsAttempted,
      step.deliveryRate.toFixed(6),
      step.avgRouteCost.toFixed(6),
      step.avgHopCount,
      step.sourceConnected,
      step.destinationConnected,
      step.totalConductance.toFixed(6),
    ].join(','));
  }

  return rows.join('\n');
}
