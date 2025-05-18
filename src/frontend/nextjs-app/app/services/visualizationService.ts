import { apiService } from './api';
import type { Visualization, CreateVisualizationDto, UpdateVisualizationDto } from '../types/api';

export class VisualizationService {
  // Cache for visualizations
  private cache = new Map<string, { data: Visualization; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getAll(forceRefresh = false): Promise<Visualization[]> {
    // Check cache first
    const cacheKey = 'all';
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return [cached.data];
    }

    const visualizations = await apiService.getVisualizations();

    // Update cache
    visualizations.forEach(viz => {
      this.cache.set(viz.id, { data: viz, timestamp: Date.now() });
    });

    return visualizations;
  }

  async getById(id: string, forceRefresh = false): Promise<Visualization> {
    // Check cache first
    const cached = this.cache.get(id);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const visualization = await apiService.getVisualization(id);

    // Update cache
    this.cache.set(id, { data: visualization, timestamp: Date.now() });

    return visualization;
  }

  async create(data: CreateVisualizationDto): Promise<Visualization> {
    const visualization = await apiService.createVisualization(data);

    // Add to cache
    this.cache.set(visualization.id, { data: visualization, timestamp: Date.now() });

    // Invalidate all cache
    this.cache.delete('all');

    return visualization;
  }

  async update(id: string, data: UpdateVisualizationDto): Promise<Visualization> {
    const visualization = await apiService.updateVisualization(id, data);

    // Update cache
    this.cache.set(id, { data: visualization, timestamp: Date.now() });

    // Invalidate all cache
    this.cache.delete('all');

    return visualization;
  }

  async delete(id: string): Promise<void> {
    await apiService.deleteVisualization(id);

    // Remove from cache
    this.cache.delete(id);

    // Invalidate all cache
    this.cache.delete('all');
  }

  // Batch operations
  async createBatch(visualizations: CreateVisualizationDto[]): Promise<Visualization[]> {
    const promises = visualizations.map(data => this.create(data));
    return Promise.all(promises);
  }

  async updateBatch(updates: Array<{ id: string; data: UpdateVisualizationDto }>): Promise<Visualization[]> {
    const promises = updates.map(({ id, data }) => this.update(id, data));
    return Promise.all(promises);
  }

  // Search and filter
  async search(query: string): Promise<Visualization[]> {
    // For now, client-side search on cached data
    const all = await this.getAll();
    const searchTerm = query.toLowerCase();

    return all.filter(viz =>
      viz.name.toLowerCase().includes(searchTerm) ||
      viz.type.toLowerCase().includes(searchTerm)
    );
  }

  async getByType(type: string): Promise<Visualization[]> {
    const all = await this.getAll();
    return all.filter(viz => viz.type === type);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Real-time updates
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToUpdates(_onUpdate: (visualization: Visualization) => void) {
    // This would integrate with WebSocket for real-time updates
    // For now, return a cleanup function
    return () => {
      // Cleanup logic
    };
  }
}

// Export singleton instance
export const visualizationService = new VisualizationService();

// Export convenience functions
export const listVisualizations = () => visualizationService.getAll();
export const getVisualization = (id: string) => visualizationService.getById(id);
export const createVisualization = (data: Partial<CreateVisualizationDto>) => {
  // Default to normal distribution visualization
  const fullData: CreateVisualizationDto = {
    name: data.name || 'New Visualization',
    type: data.type || 'normal-distribution',
    data: data.data || { parameters: [{ mean: 0, stdDev: 1 }] },
    parameters: data.parameters || {}
  };
  return visualizationService.create(fullData);
};
export const updateVisualization = (id: string, data: Partial<UpdateVisualizationDto>) => visualizationService.update(id, data);
export const deleteVisualization = (id: string) => visualizationService.delete(id);
