'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, signOut, loading } = useAuth()

  // Don't render navigation until auth state is loaded
  if (loading) {
    return (
      <header className="border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <div className="text-xl font-bold">RedClay</div>
          </nav>
        </div>
      </header>
    )
  }

  const navItems = isAuthenticated ? [
    { href: '/demand-planning', label: 'Demand Planning' }
  ] : []

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      router.push('/demand-planning')
    } else {
      router.push('/')
    }
  }

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a
              href={isAuthenticated ? "/demand-planning" : "/"}
              onClick={handleLogoClick}
              className="text-xl font-bold hover:text-primary transition-colors cursor-pointer"
            >
              RedClay
            </a>

            <ul className="main-navigation hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
