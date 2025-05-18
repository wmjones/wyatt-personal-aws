import React, { useState, useEffect } from 'react';
import NormalDistribution from './visualization/NormalDistribution';
import MarqueeText from './MarqueeText';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

const DemoPage: React.FC = () => {
  const [mean, setMean] = useState<number>(0);
  const [stdDev, setStdDev] = useState<number>(1);
  const [userId, setUserId] = useState<string>('demo-user');
  const [paramId, setParamId] = useState<string>('normal_distribution_params');
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>('System');
  const [logs, setLogs] = useState<Array<{time: string, message: string, type: 'info' | 'error' | 'success'}>>([
    { time: new Date().toTimeString().split(' ')[0], message: 'Demo page loaded. Use the controls above to test functionality.', type: 'info' }
  ]);

  // Simulated table data
  const [parameterData, setParameterData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [connectionData, setConnectionData] = useState<any>(null);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { time: timeString, message, type }]);
  };

  const fetchParameters = async () => {
    try {
      addLog(`Fetching parameters for user ${userId}, parameter ${paramId}...`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate response data
      const responseData = {
        mean: 0,
        stdDev: 1,
        lastUpdatedBy: 'System (Demo)',
        lastUpdatedAt: Date.now(),
        paramId: paramId,
        userId: userId,
        version: 'v1'
      };

      // Update the visualization parameters
      setMean(responseData.mean);
      setStdDev(responseData.stdDev);
      setLastUpdatedBy(responseData.lastUpdatedBy);

      // Update parameter status display
      setParameterData(responseData);

      // Add a history item
      setHistoryData([{
        parameter: 'mean',
        oldValue: 0,
        newValue: 0,
        time: new Date().toLocaleString(),
        updatedBy: 'System (Demo)'
      }]);

      addLog('Parameters fetched successfully', 'success');
    } catch (error) {
      addLog(`Error fetching parameters: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const updateParameters = async () => {
    try {
      // Validate inputs
      if (isNaN(mean) || isNaN(stdDev)) {
        addLog('Invalid parameters. Please enter numeric values.', 'error');
        return;
      }

      if (stdDev <= 0) {
        addLog('Standard deviation must be positive.', 'error');
        return;
      }

      addLog(`Updating parameters: mean = ${mean}, stdDev = ${stdDev}, userId = ${userId}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update parameter status
      const timestamp = Date.now();
      const version = 'v' + (parseInt(String(Math.random() * 5)) + 1);

      setParameterData({
        paramId: paramId,
        mean: mean,
        stdDev: stdDev,
        lastUpdatedAt: timestamp,
        lastUpdatedBy: `${userId} (Demo)`,
        version: version
      });

      setLastUpdatedBy(`${userId} (Demo)`);

      // Add history entry
      const param = Math.random() > 0.5 ? 'mean' : 'stdDev';
      const oldValue = (Math.random() * 2).toFixed(1);
      const newValue = (Math.random() * 2).toFixed(1);

      setHistoryData(prev => [{
        parameter: param,
        oldValue,
        newValue,
        time: new Date().toLocaleString(),
        updatedBy: `${userId} (Demo)`
      }, ...prev]);

      addLog('Parameters updated successfully', 'success');
    } catch (error) {
      addLog(`Error updating parameters: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const toggleWebSocketConnection = () => {
    if (wsStatus === 'connected') {
      // Disconnect
      setWsStatus('disconnected');
      setConnectionData(null);
      addLog('WebSocket disconnected', 'info');
    } else {
      // Connect
      setWsStatus('connecting');
      addLog('Connecting to WebSocket...', 'info');

      // Simulate connection delay
      setTimeout(() => {
        // Simulate successful connection
        setWsStatus('connected');

        // Generate a fake connection ID
        const connectionId = 'demo-conn-' + Math.random().toString(36).substring(2, 10);

        // Update connection status
        setConnectionData({
          connectionId,
          userId,
          connectedAt: new Date().toLocaleString(),
          ttl: new Date(Date.now() + 86400000).toLocaleString()
        });

        addLog(`WebSocket connected. Connection ID: ${connectionId}`, 'success');

        // Simulate parameter updates from other users occasionally
        simulateUpdates();
      }, 1500);
    }
  };

  const simulateUpdates = () => {
    if (wsStatus === 'connected') {
      setTimeout(() => {
        // Random chance of update
        if (Math.random() > 0.7) {
          // Simulate receiving a message
          const randomMean = parseFloat((Math.random() * 4 - 2).toFixed(1));
          const randomStdDev = parseFloat((Math.random() * 1.5 + 0.5).toFixed(1));
          const randomUser = 'user-' + Math.floor(Math.random() * 1000);

          addLog(`Received parameter update from ${randomUser}`, 'info');

          setMean(randomMean);
          setStdDev(randomStdDev);
          setLastUpdatedBy(`${randomUser} (Demo)`);

          // Update parameter status
          const timestamp = Date.now();
          const version = 'v' + (parseInt(String(Math.random() * 5)) + 1);

          setParameterData({
            paramId: paramId,
            mean: randomMean,
            stdDev: randomStdDev,
            lastUpdatedAt: timestamp,
            lastUpdatedBy: `${randomUser} (Demo)`,
            version: version
          });

          // Add history entry
          const param = Math.random() > 0.5 ? 'mean' : 'stdDev';
          const oldValue = (Math.random() * 2).toFixed(1);
          const newValue = (Math.random() * 2).toFixed(1);

          setHistoryData(prev => [{
            parameter: param,
            oldValue,
            newValue,
            time: new Date().toLocaleString(),
            updatedBy: `${randomUser} (Demo)`
          }, ...prev]);
        }

        // Continue simulation if still connected
        if (wsStatus === 'connected') {
          simulateUpdates();
        }
      }, 5000 + Math.random() * 10000); // Random interval between 5-15 seconds
    }
  };

  // Initial fetch of parameters
  useEffect(() => {
    fetchParameters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="retro-card p-6 mb-8">
        <h2 className="retro-text text-3xl text-center text-retro-purple mb-6">NORMAL DISTRIBUTION VISUALIZER</h2>

        {/* Connection status indicator */}
        <div className="flex items-center mb-4 mono-text">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              wsStatus === 'connected' ? 'bg-retro-teal' :
              wsStatus === 'connecting' ? 'bg-retro-yellow' :
              'bg-retro-pink'
            }`}
          ></div>
          <span>{
            wsStatus === 'connected' ? 'Connected' :
            wsStatus === 'connecting' ? 'Connecting...' :
            'Disconnected'
          }</span>
        </div>

        {/* Parameter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1" htmlFor="mean">Mean (μ)</label>
            <Input
              type="number"
              id="mean"
              value={mean}
              onChange={e => setMean(parseFloat(e.target.value))}
              step="0.1"
              retro
            />
          </div>

          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1" htmlFor="stdDev">Standard Deviation (σ)</label>
            <Input
              type="number"
              id="stdDev"
              value={stdDev}
              onChange={e => setStdDev(parseFloat(e.target.value))}
              min="0.1"
              step="0.1"
              retro
            />
          </div>

          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1" htmlFor="user-id">User ID</label>
            <Input
              type="text"
              id="user-id"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              retro
            />
          </div>

          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1" htmlFor="param-id">Parameter ID</label>
            <Input
              type="text"
              id="param-id"
              value={paramId}
              onChange={e => setParamId(e.target.value)}
              retro
            />
          </div>

          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1">&nbsp;</label>
            <button
              onClick={updateParameters}
              className="retro-button"
            >
              UPDATE PARAMETERS
            </button>
          </div>

          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1">&nbsp;</label>
            <button
              onClick={toggleWebSocketConnection}
              className="retro-button"
            >
              {wsStatus === 'connected' ? 'DISCONNECT' : 'CONNECT WEBSOCKET'}
            </button>
          </div>
        </div>

        {/* Visualization */}
        <div className="flex flex-col items-center my-8 border-4 border-black p-4 bg-white">
          <NormalDistribution mean={mean} stdDev={stdDev} updatedBy={lastUpdatedBy} />
        </div>
      </div>

      <MarqueeText text={`⚡ PARAMETER VALUES: MEAN = ${mean.toFixed(1)} ⚡ STD DEV = ${stdDev.toFixed(1)} ⚡`} />

      {/* Data tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <Card retro className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="retro-text text-xl text-retro-purple mb-2 pb-2 border-b-2 border-retro-purple border-dashed">
              PARAMETER TABLE
            </CardTitle>
          </CardHeader>
          <CardContent className="mono-text text-sm">
            {parameterData ? (
              <div className="space-y-1">
                <div>Parameter ID: {parameterData.paramId}</div>
                <div>Mean: {parameterData.mean}</div>
                <div>StdDev: {parameterData.stdDev}</div>
                <div>Last Updated: {new Date(parameterData.lastUpdatedAt).toLocaleString()}</div>
                <div>Last Updated By: {parameterData.lastUpdatedBy}</div>
                <div>Version: {parameterData.version}</div>
              </div>
            ) : (
              "Not fetched yet"
            )}
          </CardContent>
        </Card>

        <Card retro className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="retro-text text-xl text-retro-purple mb-2 pb-2 border-b-2 border-retro-purple border-dashed">
              HISTORY TABLE
            </CardTitle>
          </CardHeader>
          <CardContent className="mono-text text-sm max-h-60 overflow-y-auto">
            {historyData.length > 0 ? (
              <div className="space-y-3">
                {historyData.map((item, index) => (
                  <div key={index} className="border-b border-dashed border-gray-200 pb-2">
                    <div>Parameter: {item.parameter}</div>
                    <div>Changed from {item.oldValue} to {item.newValue}</div>
                    <div>Time: {item.time}</div>
                    <div>By: {item.updatedBy}</div>
                  </div>
                ))}
              </div>
            ) : (
              "No history yet"
            )}
          </CardContent>
        </Card>

        <Card retro className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="retro-text text-xl text-retro-purple mb-2 pb-2 border-b-2 border-retro-purple border-dashed">
              CONNECTION TABLE
            </CardTitle>
          </CardHeader>
          <CardContent className="mono-text text-sm">
            {connectionData ? (
              <div className="space-y-1">
                <div>Connection ID: {connectionData.connectionId}</div>
                <div>User ID: {connectionData.userId}</div>
                <div>Connected At: {connectionData.connectedAt}</div>
                <div>TTL: {connectionData.ttl}</div>
              </div>
            ) : (
              "Not connected"
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log output */}
      <div className="retro-card p-4 font-mono text-sm">
        <h4 className="retro-text text-xl text-retro-purple mb-2 pb-2 border-b-2 border-retro-purple border-dashed">
          SYSTEM LOG
        </h4>
        <div className="max-h-40 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 pb-1 border-b border-gray-200 border-dashed">
              <span className="text-gray-500 mr-2">[{log.time}]</span>
              <span className={
                log.type === 'error' ? 'text-retro-pink' :
                log.type === 'success' ? 'text-retro-teal' :
                'text-retro-purple'
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
