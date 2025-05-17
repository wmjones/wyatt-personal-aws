'use client'

import { useState } from 'react'

export default function DemoVisualization() {
  const [mean, setMean] = useState<number>(0)
  const [stdDev, setStdDev] = useState<number>(1)
  const [logs, setLogs] = useState<Array<{time: string, message: string, type: 'info' | 'error' | 'success'}>>([
    { time: new Date().toTimeString().split(' ')[0], message: 'Demo page loaded. Use the controls above to test functionality.', type: 'info' }
  ])

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const now = new Date()
    const timeString = now.toTimeString().split(' ')[0]
    setLogs(prev => [...prev.slice(-4), { time: timeString, message, type }])
  }

  const handleParameterUpdate = () => {
    addLog(`Parameters updated: mean=${mean}, stdDev=${stdDev}`, 'success')
  }

  return (
    <div className="space-y-6">
      {/* Parameter Controls */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold mb-4">Parameter Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mean" className="block text-sm font-medium mb-2">
              Mean (μ)
            </label>
            <input
              type="number"
              id="mean"
              value={mean}
              onChange={(e) => setMean(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
              step="0.1"
            />
          </div>
          <div>
            <label htmlFor="stdDev" className="block text-sm font-medium mb-2">
              Standard Deviation (σ)
            </label>
            <input
              type="number"
              id="stdDev"
              value={stdDev}
              onChange={(e) => setStdDev(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
        <button
          onClick={handleParameterUpdate}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Update Parameters
        </button>
      </div>

      {/* Visualization Display */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold mb-4">Visualization</h2>
        <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Normal Distribution</p>
            <p className="text-sm text-muted-foreground">μ = {mean}, σ = {stdDev}</p>
            <p className="text-xs text-muted-foreground mt-4">
              D3.js visualization will be implemented here
            </p>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold mb-4">Activity Log</h2>
        <div className="space-y-2">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`text-sm p-2 rounded ${
                log.type === 'error' ? 'bg-error/10 text-error' :
                log.type === 'success' ? 'bg-success/10 text-success' :
                'bg-muted text-muted-foreground'
              }`}
            >
              <span className="font-mono text-xs">{log.time}</span>
              <span className="ml-2">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-bold mb-4">Parameter Table</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Parameter</th>
                <th className="text-left py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">Mean (μ)</td>
                <td className="py-2">{mean}</td>
              </tr>
              <tr>
                <td className="py-2">Std Dev (σ)</td>
                <td className="py-2">{stdDev}</td>
              </tr>
              <tr>
                <td className="py-2">Last Updated</td>
                <td className="py-2">{new Date().toLocaleTimeString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-bold mb-4">History Table</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(-3).reverse().map((log, index) => (
                <tr key={index}>
                  <td className="py-2 font-mono text-xs">{log.time}</td>
                  <td className="py-2 text-xs">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
