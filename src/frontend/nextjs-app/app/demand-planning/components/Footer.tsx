export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dp-surface-primary border-t border-dp-border-light h-[var(--dp-footer-height)] px-4 flex items-center justify-between text-dp-text-secondary text-sm">
      <div>
        © {currentYear} Company Name
      </div>
      <div className="flex items-center gap-4">
        <span>Version 1.0.0</span>
        <a href="#" className="hover:text-dp-text-primary transition-colors">Help</a>
        <a href="#" className="hover:text-dp-text-primary transition-colors">Privacy</a>
        <a href="#" className="hover:text-dp-text-primary transition-colors">Terms</a>
      </div>
    </footer>
  );
}
