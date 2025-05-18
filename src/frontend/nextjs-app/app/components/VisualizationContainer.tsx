'use client';

import { useState, useEffect } from 'react';
import { getVisualization } from '../services/visualizationService';
import ResponsiveD3Chart from './visualizations/ResponsiveD3Chart';

import { Parameter, NormalDistributionVisualization, isNormalDistribution } from '../types/visualization';
import { Visualization } from '../types/api';

interface VisualizationContainerProps {
  id: string;
  onUpdate?: (parameters: Parameter[]) => void;
}

export default function VisualizationContainer({ id, onUpdate }: VisualizationContainerProps) {
  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisualization = async () => {
      try {
        const data = await getVisualization(id);
        setVisualization(data);
      } catch (error) {
        console.error('Failed to load visualization:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVisualization();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full p-4">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!visualization) {
    return (
      <div className="w-full p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          Failed to load visualization
        </div>
      </div>
    );
  }

  // Type guard to ensure we have a normal distribution visualization
  if (!isNormalDistribution(visualization)) {
    return (
      <div className="w-full p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          Invalid visualization type
        </div>
      </div>
    );
  }

  const normalViz = visualization as NormalDistributionVisualization;

  return (
    <div className="w-full p-4">
      <ResponsiveD3Chart
        parameters={normalViz.data.parameters}
        onParameterChange={onUpdate ? (index, param) => {
          const newParams = [...normalViz.data.parameters];
          newParams[index] = param;
          onUpdate(newParams);
        } : undefined}
      />
    </div>
  );
}
