import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About - D3 Dashboard',
  description: 'Learn about the D3 Dashboard and Productivity System',
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">About D3 Dashboard</h1>

      <div className="prose prose-lg max-w-none">
        <div className="bg-card p-6 rounded-lg border border-border mb-8">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-4">
            The D3 Dashboard & Productivity System combines powerful data visualization tools
            with automated productivity workflows to help teams make data-driven decisions
            and streamline their workflows. TODO
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-3">Data Visualization</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Interactive D3.js visualizations</li>
              <li>• Real-time parameter controls</li>
              <li>• Collaborative editing features</li>
              <li>• Historical data tracking</li>
              <li>• Export capabilities</li>
            </ul>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-3">Productivity Integration</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Todoist task synchronization</li>
              <li>• ChatGPT task enrichment</li>
              <li>• Notion knowledge base</li>
              <li>• Automated workflows</li>
              <li>• Scheduled processing</li>
            </ul>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border mb-8">
          <h2 className="text-2xl font-bold mb-4">Technical Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Next.js 14</li>
                <li>React</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>D3.js</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Backend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Vercel Edge Functions</li>
                <li>PostgreSQL (Neon)</li>
                <li>Prisma ORM</li>
                <li>RESTful APIs</li>
                <li>WebSockets</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Infrastructure</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Vercel Platform</li>
                <li>AWS Cognito</li>
                <li>GitHub Actions</li>
                <li>Terraform IaC</li>
                <li>CloudFront CDN</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border mb-8">
          <h2 className="text-2xl font-bold mb-4">Security & Compliance</h2>
          <p className="text-muted-foreground mb-4">
            We take security seriously with enterprise-grade features:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
            <li>• JWT-based authentication</li>
            <li>• Row-level security</li>
            <li>• Encrypted data storage</li>
            <li>• HTTPS everywhere</li>
            <li>• Regular security audits</li>
            <li>• GDPR compliance</li>
          </ul>
        </div>

        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign Up Now
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
