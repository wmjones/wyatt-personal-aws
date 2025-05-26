import { forecastCache } from '@/app/lib/forecast-cache';
import { forecastService } from '@/app/services/forecastService';

/**
 * Preload common forecast views in the background
 * This runs after the initial page load to prepare cache for common scenarios
 */
export async function preloadCommonViews() {
  try {
    // Get available states
    const states = await forecastService.getDistinctStates();

    if (states.length === 0) {
      console.log('No states available for preloading');
      return;
    }

    // Define common views to preload
    const commonViews = [
      // First state with full date range (most common initial view)
      {
        states: [states[0]],
        dmaIds: [],
        dcIds: []
      },
      // Second state if available
      ...(states.length > 1 ? [{
        states: [states[1]],
        dmaIds: [],
        dcIds: []
      }] : []),
      // Most populous state (if we can determine it)
      // This would require additional logic to identify
    ];

    console.log('Preloading common views in background...');

    // Use setTimeout to defer preloading until after initial render
    setTimeout(() => {
      commonViews.forEach(async (view) => {
        const cacheKey = forecastCache.generateKey(view);

        // Check if already cached
        if (forecastCache.get(cacheKey)) {
          return;
        }

        try {
          // This is a simplified version - in real implementation,
          // you'd want to replicate the full data fetching logic
          console.log(`Preloading view for state: ${view.states[0]}`);

          // Note: This is pseudo-code - you'd need to implement
          // a proper data fetching function that matches useForecast
          // const data = await fetchForecastData(view);
          // forecastCache.set(cacheKey, data);
        } catch (error) {
          console.error('Error preloading view:', error);
        }
      });
    }, 5000); // Wait 5 seconds after page load
  } catch (error) {
    console.error('Error in preload strategy:', error);
  }
}
