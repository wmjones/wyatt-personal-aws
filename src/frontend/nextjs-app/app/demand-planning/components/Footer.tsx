export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 h-[var(--dp-footer-height)] px-6 flex items-center justify-between text-sm">
      <div className="text-gray-600">
        © {currentYear} Company Name
      </div>
      <div className="flex items-center gap-6">
        <span className="text-gray-500">Version 1.0.0</span>
        <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Help</a>
        <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy</a>
        <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms</a>
      </div>
    </footer>
  );
}
