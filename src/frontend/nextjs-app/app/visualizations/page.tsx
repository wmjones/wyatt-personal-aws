'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import authService from '../services/auth'
import VisualizationContainer from '../components/VisualizationContainer'
import { listVisualizations, createVisualization, updateVisualization } from '../services/visualizationService'
import { Parameter, isNormalDistribution } from '../types/visualization'
import { Visualization } from '../types/api'

export default function VisualizationDashboard() {
  const router = useRouter()
  const [visualizations, setVisualizations] = useState<Visualization[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const verifyAuth = async () => {
      const user = await authService.getCurrentUser()
      if (!user.success || !user.user) {
        router.push('/login')
        return
      }

      // Load visualizations
      try {
        const data = await listVisualizations()
        setVisualizations(data)
        if (data.length > 0) {
          setSelectedId(data[0].id)
        }
      } catch (error) {
        console.error('Failed to load visualizations:', error)
      } finally {
        setLoading(false)
      }
    }

    verifyAuth()
  }, [router])

  const handleCreateNew = async () => {
    try {
      const newViz = await createVisualization({
        name: `Visualization ${visualizations.length + 1}`,
        type: 'normal-distribution',
        data: { parameters: [{ mean: 0, stdDev: 1 }] }
      })
      setVisualizations([...visualizations, newViz])
      setSelectedId(newViz.id)
    } catch (error) {
      console.error('Failed to create visualization:', error)
    }
  }

  const handleUpdate = async (parameters: Parameter[]) => {
    if (!selectedId) return

    try {
      await updateVisualization(selectedId, {
        data: { parameters }
      })
      // Update local state
      setVisualizations(visualizations.map(v =>
        v.id === selectedId ? { ...v, data: { parameters } } : v
      ))
    } catch (error) {
      console.error('Failed to update visualization:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">D3.js Visualizations</h1>
        <p className="text-gray-600">Interactive normal distribution visualizations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with visualization list */}
        <div className="lg:col-span-1">
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Visualizations</h2>
              <button
                onClick={handleCreateNew}
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                New
              </button>
            </div>

            <div className="space-y-2">
              {visualizations.map(viz => (
                <button
                  key={viz.id}
                  onClick={() => setSelectedId(viz.id)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    selectedId === viz.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{viz.name}</div>
                  <div className="text-sm opacity-75">
                    {isNormalDistribution(viz) ?
                      `μ=${viz.data.parameters[0].mean}, σ=${viz.data.parameters[0].stdDev}` :
                      viz.type
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main visualization area */}
        <div className="lg:col-span-3">
          {selectedId ? (
            <VisualizationContainer
              id={selectedId}
              onUpdate={handleUpdate}
            />
          ) : (
            <div className="bg-card p-8 rounded-lg border border-border text-center">
              <p className="text-muted-foreground">
                Create a new visualization to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
