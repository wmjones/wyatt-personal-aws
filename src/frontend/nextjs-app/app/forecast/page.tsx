import { Metadata } from 'next';
import ForecastDashboard from '../components/forecast/ForecastDashboard';
import { ForecastDataViewer } from './components/ForecastDataViewer';

export const metadata: Metadata = {
  title: 'Forecast Dashboard',
  description: 'Forecast data analysis and visualization dashboard',
};

/**
 * Forecast Dashboard Page
 */
export default function ForecastPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Forecast Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        View and analyze forecast data from Amazon S3 via Athena queries.
      </p>

      {/* Athena Data Viewer */}
      <div className="mb-8">
        <ForecastDataViewer />
      </div>

      {/* Original D3 Dashboard */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">D3 Visualization</h2>
        <ForecastDashboard />
      </div>
    </div>
  );
}
