export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RedClay. All rights reserved.
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>LTO Demand Planning System</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
