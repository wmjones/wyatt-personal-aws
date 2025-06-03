'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'

export default function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, signOut } = useAuth()

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    ...(isAuthenticated ? [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/demand-planning', label: 'Demand Planning' },
      { href: '/visualizations', label: 'Reports' }
    ] : []),
  ]

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              LTO Demand Planning
            </Link>

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
