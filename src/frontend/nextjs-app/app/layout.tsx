import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { QueryProvider } from "./providers/query-provider";
import Header from "./components/header";
import Footer from "./components/footer";
import { Toaster } from "react-hot-toast";
import OnboardingManager from "./components/onboarding/OnboardingManager";
import FeedbackButton from "./components/FeedbackButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "RedClay - Demand Planning",
    template: "%s | RedClay"
  },
  description: "Demand Planning and Forecasting Platform by RedClay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
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
