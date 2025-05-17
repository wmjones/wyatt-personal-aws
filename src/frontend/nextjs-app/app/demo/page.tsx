import { Metadata } from 'next'
import DemoVisualization from '@/app/components/demo-visualization'

export const metadata: Metadata = {
  title: 'Demo - D3 Dashboard',
  description: 'Interactive visualization demo with real-time parameter controls',
}

export default function DemoPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Interactive Demo</h1>

      <div className="mb-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          This is a demo of our interactive visualization tools. Use the controls below to adjust parameters and see real-time updates.
        </p>
      </div>

      <DemoVisualization />
    </main>
  )
}
