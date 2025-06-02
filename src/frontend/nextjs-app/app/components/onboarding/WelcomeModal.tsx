'use client';

import { useState } from 'react';
import { X, Zap, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';
import { useOnboarding } from './hooks/useOnboarding';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export default function WelcomeModal({ isOpen, onClose, onStartTour }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { markWelcomeSeen } = useOnboarding();

  const slides = [
    {
      icon: <Zap className="w-12 h-12 text-yellow-500" />,
      title: "Welcome to Demand Planning!",
      content: "Your all-in-one solution for accurate demand forecasting and inventory optimization.",
      cta: "Get Started"
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-green-500" />,
      title: "Real-Time Forecasting",
      content: "View and adjust demand forecasts with instant feedback. Make data-driven decisions with confidence.",
      cta: "Learn More"
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-blue-500" />,
      title: "Interactive Visualizations",
      content: "Explore your data through intuitive charts and filters. Spot trends and patterns at a glance.",
      cta: "Take a Tour"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleStartTour();
    }
  };

  const handleSkip = async () => {
    await markWelcomeSeen();
    onClose();
  };

  const handleStartTour = async () => {
    await markWelcomeSeen();
    onStartTour();
    onClose();
  };

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {currentSlideData.icon}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentSlideData.title}
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-8">
              {currentSlideData.content}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide
                      ? 'bg-indigo-600'
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium inline-flex items-center gap-2 transition-colors"
              >
                {currentSlideData.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
