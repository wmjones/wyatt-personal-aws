'use client';

import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import OnboardingProgress from '../components/onboarding/OnboardingProgress';

export default function DashboardPage() {
  const { signOut, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Demand Planning Dashboard</h1>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>

          {/* Onboarding Progress */}
          <OnboardingProgress />

          {/* Key Metrics Section */}
          <div className="dashboard-stats grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Forecast</h3>
              <p className="text-2xl font-bold">$2.4M</p>
              <p className="text-sm text-green-600 mt-1">+12% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Accuracy Rate</h3>
              <p className="text-2xl font-bold">94.2%</p>
              <p className="text-sm text-green-600 mt-1">+2.1% improvement</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Items</h3>
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-sm text-gray-600 mt-1">Across 5 regions</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Adjustments</h3>
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-blue-600 mt-1">This week</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => router.push('/demand-planning')}
                className="justify-start"
              >
                View Forecasts
              </Button>
              <Button
                onClick={() => router.push('/demand-planning')}
                variant="outline"
                className="justify-start"
              >
                Make Adjustments
              </Button>
              <Button
                onClick={() => router.push('/visualizations')}
                variant="outline"
                className="justify-start"
              >
                Generate Reports
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Adjustments</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">Product ABC123</p>
                    <p className="text-sm text-gray-600">California - +15%</p>
                  </div>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">Product XYZ789</p>
                    <p className="text-sm text-gray-600">Texas - -5%</p>
                  </div>
                  <p className="text-sm text-gray-500">5 hours ago</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="font-medium">Low inventory forecast</p>
                    <p className="text-sm text-gray-600">5 items in Northeast region</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="font-medium">Forecast accuracy improved</p>
                    <p className="text-sm text-gray-600">West region now at 96%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
