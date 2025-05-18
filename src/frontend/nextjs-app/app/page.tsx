import { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from './components/theme-toggle'

export const metadata: Metadata = {
  title: 'D3 Dashboard & Productivity System',
  description: 'Interactive data visualizations and automated productivity workflows',
}

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">D3 Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
        <div className="order-2 md:order-1">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-primary">Data Visualization</h2>
            <p className="text-lg text-muted-foreground">
              Experience interactive data visualization with our modern dashboard.
              Explore statistical distributions with real-time parameter controls.
            </p>
            <div className="flex gap-4">
              <Link
                href="/demo"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Demo
              </Link>
              <Link
                href="/about"
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                About
              </Link>
            </div>

            <div className="border-2 border-dashed border-primary p-4 rounded-lg bg-card">
              <p className="text-sm">
                <span className="text-primary font-bold">NEW:</span>
                {' '}Interactive normal distribution visualization with parameter controls!
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-2xl font-bold mb-4 text-center">Features</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-primary mr-2">→</span>
                <span>Interactive parameter controls</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">→</span>
                <span>Real-time visualization updates</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">→</span>
                <span>Statistical insights</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">→</span>
                <span>Collaborative editing</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">→</span>
                <span>Change history tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h4 className="font-bold mb-2">Visualization Tools</h4>
          <p className="text-sm text-muted-foreground">
            Advanced D3.js visualizations with interactive controls and real-time updates.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <h4 className="font-bold mb-2">Productivity Integration</h4>
          <p className="text-sm text-muted-foreground">
            Automated workflows connecting Todoist, ChatGPT, and Notion.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <h4 className="font-bold mb-2">Cloud Infrastructure</h4>
          <p className="text-sm text-muted-foreground">
            Serverless architecture with AWS services for scalability and reliability.
          </p>
        </div>
      </div>
    </main>
  )
}
