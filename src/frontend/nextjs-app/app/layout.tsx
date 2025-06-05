import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { QueryProvider } from "./providers/query-provider";
import Header from "./components/header";
import Footer from "./components/footer";
import { Toaster } from "react-hot-toast";
import OnboardingManager from "./components/onboarding/OnboardingManager";
import FeedbackButton from "./components/FeedbackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LTO Demand Planning",
    template: "%s | LTO Demand Planning"
  },
  description: "Limited Time Offer Demand Planning by RedClay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <QueryProvider>
          <AuthProvider>
            <OnboardingManager>
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <FeedbackButton />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#10B981',
                    },
                  },
                  error: {
                    style: {
                      background: '#EF4444',
                    },
                  },
                }}
              />
            </OnboardingManager>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
