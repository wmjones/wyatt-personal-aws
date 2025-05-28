import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ChartDimensions, ChartState } from '../types';

interface UseD3ChartOptions<T = unknown> {
  data: T[];
  dimensions: ChartDimensions;
  deps?: React.DependencyList;
}

interface UseD3ChartReturn {
  svgRef: React.RefObject<SVGSVGElement | null>;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  g: d3.Selection<SVGGElement, unknown, null, undefined> | null;
  state: ChartState;
  updateTooltip: (visible: boolean, content?: React.ReactNode, position?: { x: number; y: number }) => void;
  clearChart: () => void;
}

/**
 * useD3Chart Hook
 *
 * Manages D3 chart lifecycle, including SVG setup, cleaning,
 * and common state management.
 *
 * @example
 * const { svgRef, svg, g, state, updateTooltip } = useD3Chart({
 *   data,
 *   dimensions,
 *   deps: [colorScheme]
 * });
 *
 * useEffect(() => {
 *   if (!g || !data.length) return;
 *   // Render your chart using g selection
 * }, [g, data]);
 */
export function useD3Chart<T = unknown>({
  data,
  dimensions,
  deps = [],
}: UseD3ChartOptions<T>): UseD3ChartReturn {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svg, setSvg] = useState<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const [g, setG] = useState<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const [state, setState] = useState<ChartState>({
    tooltip: {
      visible: false,
      content: null,
      position: { x: 0, y: 0 },
    },
    hoveredItem: null,
    selectedItems: [],
    zoomTransform: null,
    brushSelection: null,
  });

  // Initialize SVG and main group
  useEffect(() => {
    if (!svgRef.current || dimensions.width <= 0 || dimensions.height <= 0) return;

    const svgSelection = d3.select(svgRef.current);
    setSvg(svgSelection);

    // Clear previous content
    svgSelection.selectAll('*').remove();

    // Create main group with margins
    const mainGroup = svgSelection
      .append('g')
      .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    setG(mainGroup);

    return () => {
      // Cleanup
      svgSelection.selectAll('*').remove();
    };
  }, [dimensions.width, dimensions.height, dimensions.margin.left, dimensions.margin.top]);

  // Clear chart helper
  const clearChart = useCallback(() => {
    if (g) {
      g.selectAll('*').remove();
    }
  }, [g]);

  // Update tooltip helper
  const updateTooltip = useCallback((
    visible: boolean,
    content?: React.ReactNode,
    position?: { x: number; y: number }
  ) => {
    setState(prev => ({
      ...prev,
      tooltip: {
        visible,
        content: content || prev.tooltip.content,
        position: position || prev.tooltip.position,
      },
    }));
  }, []);

  // Re-render chart when dependencies change
  useEffect(() => {
    if (!g || !data.length) return;
    clearChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, data, clearChart, ...deps]);

  return {
    svgRef,
    svg,
    g,
    state,
    updateTooltip,
    clearChart,
  };
}

/**
 * useChartInteraction Hook
 *
 * Handles common chart interaction patterns like hover and click.
 */
export function useChartInteraction() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const handleClick = useCallback((index: number, multiSelect = false) => {
    if (multiSelect) {
      setSelectedIndices(prev =>
        prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      setSelectedIndices([index]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIndices([]);
  }, []);

  return {
    hoveredIndex,
    selectedIndices,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    clearSelection,
  };
}
