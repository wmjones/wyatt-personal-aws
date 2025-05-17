import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <div className="text-4xl mb-8">¯\_(ツ)_/¯</div>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Oops! Looks like this page got lost in cyberspace.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity inline-block"
        >
          Return Home
        </Link>
      </div>
    </main>
  )
}
