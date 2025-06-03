'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface DebugInfo {
  timestamp: string;
  action: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: Error | Record<string, unknown> | string;
}

export default function AdjustmentDebugPanel() {
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const auth = useAuth();

  const addLog = (info: Omit<DebugInfo, 'timestamp'>) => {
    setDebugLogs(prev => [
      {
        ...info,
        timestamp: new Date().toISOString()
      },
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  };

  const testSaveAdjustment = async () => {
    addLog({ action: 'Starting save adjustment test' });

    try {
      const token = await auth.getIdToken();
      addLog({ action: 'Got auth token', response: { tokenLength: token?.length } });

      const testPayload = {
        adjustmentValue: 5,
        filterContext: {
          states: ['TX'],
          dmaIds: [],
          dcIds: [],
          inventoryItemId: '123',
          dateRange: {
            startDate: '2025-01-01',
            endDate: '2025-01-31'
          }
        },
        inventoryItemName: 'Test Item'
      };

      addLog({ action: 'Sending POST request', request: testPayload });

      const response = await fetch('/api/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(testPayload)
      });

      const responseData = await response.json();

      addLog({
        action: 'Received response',
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        }
      });

      if (!response.ok) {
        addLog({ action: 'Error response', error: responseData });
      }
    } catch (error) {
      addLog({ action: 'Caught exception', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const testLoadAdjustments = async () => {
    addLog({ action: 'Starting load adjustments test' });

    try {
      const token = await auth.getIdToken();
      addLog({ action: 'Got auth token', response: { tokenLength: token?.length } });

      const response = await fetch('/api/adjustments?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const responseData = await response.json();

      addLog({
        action: 'Received response',
        response: {
          status: response.status,
          statusText: response.statusText,
          adjustmentCount: responseData.adjustments?.length,
          data: responseData
        }
      });

      if (!response.ok) {
        addLog({ action: 'Error response', error: responseData });
      }
    } catch (error) {
      addLog({ action: 'Caught exception', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const checkDatabaseTable = async () => {
    addLog({ action: 'Checking database table status' });

    try {
      const token = await auth.getIdToken();

      // Try to get adjustments which will trigger table creation
      const response = await fetch('/api/adjustments?all=true&limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      addLog({
        action: 'Table check response',
        response: {
          status: response.status,
          hasAdjustments: data.adjustments?.length > 0,
          tableExists: response.ok
        }
      });
    } catch (error) {
      addLog({ action: 'Table check error', error: error instanceof Error ? error.message : String(error) });
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 z-50"
      >
        Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-semibold">Adjustment Debug Panel</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-2">
        <button
          onClick={checkDatabaseTable}
          className="w-full px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          Check Database Table
        </button>
        <button
          onClick={testSaveAdjustment}
          className="w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Test Save Adjustment
        </button>
        <button
          onClick={testLoadAdjustments}
          className="w-full px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Test Load Adjustments
        </button>
        <button
          onClick={() => setDebugLogs([])}
          className="w-full px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Clear Logs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {debugLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">No logs yet. Click a test button above.</p>
        ) : (
          <div className="space-y-2">
            {debugLogs.map((log, index) => (
              <div key={index} className="text-xs border-b pb-2">
                <div className="font-semibold text-gray-700">
                  {new Date(log.timestamp).toLocaleTimeString()} - {log.action}
                </div>
                {log.request && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-blue-600">Request</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(log.request, null, 2)}
                    </pre>
                  </details>
                )}
                {log.response && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-green-600">Response</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </details>
                )}
                {log.error && (
                  <details className="mt-1 open">
                    <summary className="cursor-pointer text-red-600">Error</summary>
                    <pre className="mt-1 p-2 bg-red-50 rounded overflow-x-auto text-red-700">
                      {JSON.stringify(log.error, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
