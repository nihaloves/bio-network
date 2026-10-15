import type { SimRunConfig, Density, DisruptionType, RoutingStrategy } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

const VALID_DENSITIES: Density[] = ['sparse', 'balanced', 'dense'];
const VALID_DISRUPTIONS: DisruptionType[] = [
  'none',
  'node-failure',
  'connection-failure',
  'increased-cost',
  'multiple-failures',
];
const VALID_STRATEGIES: RoutingStrategy[] = ['conventional', 'adaptive', 'compare'];

/**
 * Validate a simulation configuration.
 * Returns an array of validation errors (empty if valid).
 */
export function validateConfig(config: Partial<SimRunConfig>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (config.nodeCount === undefined || config.nodeCount === null) {
    errors.push({ field: 'nodeCount', message: 'Number of nodes is required.' });
  } else if (!Number.isInteger(config.nodeCount)) {
    errors.push({ field: 'nodeCount', message: 'Number of nodes must be an integer.' });
  } else if (config.nodeCount < 20 || config.nodeCount > 100) {
    errors.push({ field: 'nodeCount', message: 'Number of nodes must be between 20 and 100.' });
  }

  if (config.density && !VALID_DENSITIES.includes(config.density)) {
    errors.push({ field: 'density', message: 'Density must be sparse, balanced, or dense.' });
  }

  if (config.seed === undefined || config.seed === null) {
    errors.push({ field: 'seed', message: 'Random seed is required.' });
  } else if (!Number.isInteger(config.seed) || config.seed < 0) {
    errors.push({ field: 'seed', message: 'Random seed must be a non-negative integer.' });
  }

  if (config.sourceNode === undefined || config.sourceNode === null) {
    errors.push({ field: 'sourceNode', message: 'Source node is required.' });
  } else if (!Number.isInteger(config.sourceNode) || config.sourceNode < 0) {
    errors.push({ field: 'sourceNode', message: 'Source node must be a valid node ID.' });
  }

  if (config.destinationNode === undefined || config.destinationNode === null) {
    errors.push({ field: 'destinationNode', message: 'Destination node is required.' });
  } else if (!Number.isInteger(config.destinationNode) || config.destinationNode < 0) {
    errors.push({ field: 'destinationNode', message: 'Destination node must be a valid node ID.' });
  }

  if (
    config.sourceNode !== undefined &&
    config.destinationNode !== undefined &&
    config.sourceNode === config.destinationNode
  ) {
    errors.push({ field: 'destinationNode', message: 'Source and destination must be different nodes.' });
  }

  if (config.packetCount === undefined || config.packetCount === null) {
    errors.push({ field: 'packetCount', message: 'Number of packets is required.' });
  } else if (!Number.isInteger(config.packetCount)) {
    errors.push({ field: 'packetCount', message: 'Number of packets must be an integer.' });
  } else if (config.packetCount < 10 || config.packetCount > 500) {
    errors.push({ field: 'packetCount', message: 'Number of packets must be between 10 and 500.' });
  }

  if (config.disruptionType && !VALID_DISRUPTIONS.includes(config.disruptionType)) {
    errors.push({ field: 'disruptionType', message: 'Invalid disruption type.' });
  }

  if (config.disruptionSeverity !== undefined) {
    if (typeof config.disruptionSeverity !== 'number' || config.disruptionSeverity < 0 || config.disruptionSeverity > 100) {
      errors.push({ field: 'disruptionSeverity', message: 'Severity must be between 0 and 100.' });
    }
  }

  if (config.strategy && !VALID_STRATEGIES.includes(config.strategy)) {
    errors.push({ field: 'strategy', message: 'Invalid routing strategy.' });
  }

  if (config.maxSteps !== undefined) {
    if (!Number.isInteger(config.maxSteps) || config.maxSteps < 1 || config.maxSteps > 100) {
      errors.push({ field: 'maxSteps', message: 'Max steps must be between 1 and 100.' });
    }
  }

  // Check source/destination within node range
  if (config.nodeCount !== undefined && config.sourceNode !== undefined) {
    if (config.sourceNode >= config.nodeCount) {
      errors.push({ field: 'sourceNode', message: `Source node must be between 0 and ${config.nodeCount - 1}.` });
    }
  }
  if (config.nodeCount !== undefined && config.destinationNode !== undefined) {
    if (config.destinationNode >= config.nodeCount) {
      errors.push({ field: 'destinationNode', message: `Destination node must be between 0 and ${config.nodeCount - 1}.` });
    }
  }

  return errors;
}

/**
 * Returns true if the config has no validation errors.
 */
export function isValidConfig(config: Partial<SimRunConfig>): boolean {
  return validateConfig(config).length === 0;
}
