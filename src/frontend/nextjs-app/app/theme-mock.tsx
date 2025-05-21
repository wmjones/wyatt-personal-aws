'use client'

// Mock component for theme toggle during static generation
export function MockThemeToggle() {
  return (
    <div className="w-[180px] h-10 bg-secondary rounded-lg">
      <span className="sr-only">Theme toggle (mock)</span>
    </div>
  )
}
