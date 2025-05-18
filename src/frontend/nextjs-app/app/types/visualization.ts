import { Visualization as ApiVisualization } from './api';

export interface Parameter {
  mean: number;
  stdDev: number;
}

export interface NormalDistributionData {
  parameters: Parameter[];
}

export interface NormalDistributionVisualization extends Omit<ApiVisualization, 'data'> {
  type: 'normal-distribution';
  data: NormalDistributionData;
}

// Type guard
export function isNormalDistribution(viz: ApiVisualization): viz is NormalDistributionVisualization {
  return viz.type === 'normal-distribution';
}
