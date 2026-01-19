import { useState, useEffect, useCallback } from 'react';

interface UseCarouselOptions {
  slideCount: number;
  autoPlayInterval?: number;
  pauseOnInteraction?: boolean;
}

interface UseCarouselReturn {
  currentSlide: number;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  isPaused: boolean;
  pauseAutoplay: () => void;
  resumeAutoplay: () => void;
}

export const useCarousel = ({
  slideCount,
  autoPlayInterval = 5000,
  pauseOnInteraction = true,
}: UseCarouselOptions): UseCarouselReturn => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [interactionTimeout, setInteractionTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < slideCount) {
        setCurrentSlide(index);
        if (pauseOnInteraction) {
          setIsPaused(true);
          // Auto-resume after 3 seconds of no interaction
          if (interactionTimeout) {
            clearTimeout(interactionTimeout);
          }
          const timeout = setTimeout(() => {
            setIsPaused(false);
          }, 3000);
          setInteractionTimeout(timeout);
        }
      }
    },
    [slideCount, pauseOnInteraction, interactionTimeout]
  );

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
    if (pauseOnInteraction) {
      setIsPaused(true);
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
      }
      const timeout = setTimeout(() => {
        setIsPaused(false);
      }, 3000);
      setInteractionTimeout(timeout);
    }
  }, [slideCount, pauseOnInteraction, interactionTimeout]);

  const previousSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
    if (pauseOnInteraction) {
      setIsPaused(true);
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
      }
      const timeout = setTimeout(() => {
        setIsPaused(false);
      }, 3000);
      setInteractionTimeout(timeout);
    }
  }, [slideCount, pauseOnInteraction, interactionTimeout]);

  const pauseAutoplay = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeAutoplay = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, slideCount, autoPlayInterval]);

  useEffect(() => {
    return () => {
      if (interactionTimeout) {
        clearTimeout(interactionTimeout);
      }
    };
  }, [interactionTimeout]);

  return {
    currentSlide,
    goToSlide,
    nextSlide,
    previousSlide,
    isPaused,
    pauseAutoplay,
    resumeAutoplay,
  };
};
