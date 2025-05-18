export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} D3 Dashboard. All rights reserved.
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="https://github.com" className="hover:text-primary transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
