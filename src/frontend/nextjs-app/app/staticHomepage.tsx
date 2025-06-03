import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'LTO Demand Planning',
  description: 'Limited Time Offer Demand Planning by RedClay',
}

export default function StaticHomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">LTO Demand Planning</h1>
        <div className="w-[180px] h-10"></div> {/* Theme toggle placeholder */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
        <div className="order-2 md:order-1">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-primary">Data Visualization</h2>
            <p className="text-lg text-muted-foreground">
              Experience interactive data visualization with our modern dashboard.
              Explore statistical distributions with real-time parameter controls.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/demand-planning"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                View Dashboard
              </Link>
              <Link
                href="/about"
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                About
              </Link>
              <Link
                href="/demand-planning"
                className="px-6 py-3 bg-[#E51636] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Demand Planning
              </Link>
            </div>

            <div className="border-2 border-dashed border-primary p-4 rounded-lg bg-card">
              <p className="text-sm">
                <span className="text-primary font-bold">NEW:</span>
                {' '}Check out our Demand Planning Dashboard with interactive forecast visualizations!
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
                <span>Hierarchical forecast views</span>
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
          <h4 className="font-bold mb-2">Demand Planning</h4>
          <p className="text-sm text-muted-foreground">
            Hierarchical forecast visualization and adjustment tools with Apple OSX aesthetic.
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
