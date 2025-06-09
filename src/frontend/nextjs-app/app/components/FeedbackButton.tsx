'use client';

import { useState } from 'react';
import { MessageSquare, X, ExternalLink } from 'lucide-react';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-40"
        aria-label="Open feedback"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Feedback & Support</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close feedback"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div>
                <p className="text-sm text-muted-foreground">
                  We&apos;d love to hear your feedback! You can report issues, suggest features, or ask questions through our GitHub repository.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm uppercase text-muted-foreground">Quick Actions</h3>

                <a
                  href="https://github.com/wmjones/wyatt-personal-aws/issues/new?labels=bug&template=bug_report.md&title=[Bug]:"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                >
                  <div className="flex-1">
                    <h4 className="font-medium group-hover:text-primary transition-colors">Report a Bug</h4>
                    <p className="text-sm text-muted-foreground mt-1">Something not working as expected?</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                <a
                  href="https://github.com/wmjones/wyatt-personal-aws/issues/new?labels=enhancement&template=feature_request.md&title=[Feature]:"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                >
                  <div className="flex-1">
                    <h4 className="font-medium group-hover:text-primary transition-colors">Request a Feature</h4>
                    <p className="text-sm text-muted-foreground mt-1">Have an idea to improve the app?</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                <a
                  href="https://github.com/wmjones/wyatt-personal-aws/issues/new?labels=question&title=[Question]:"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                >
                  <div className="flex-1">
                    <h4 className="font-medium group-hover:text-primary transition-colors">Ask a Question</h4>
                    <p className="text-sm text-muted-foreground mt-1">Need help or clarification?</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>

              {/* Instructions */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="font-medium text-sm uppercase text-muted-foreground">How to Report an Issue</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Click one of the links above to open a new issue on GitHub</li>
                  <li>2. Sign in to GitHub (or create a free account)</li>
                  <li>3. Fill out the issue template with details</li>
                  <li>4. Submit your issue and we&apos;ll respond as soon as possible</li>
                </ol>
              </div>

              {/* Repository Link */}
              <div className="flex items-center justify-center pt-4 border-t border-border">
                <a
                  href="https://github.com/wmjones/wyatt-personal-aws"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View Repository
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
