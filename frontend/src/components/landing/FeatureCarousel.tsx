import { useCarousel } from '../../hooks/useCarousel';
import { RacePredictionSlide } from './slides/RacePredictionSlide';
import { CrazyPredictionSlide } from './slides/CrazyPredictionSlide';
import { ValidationSlide } from './slides/ValidationSlide';
import { SeasonPredictionSlide } from './slides/SeasonPredictionSlide';
import { SillySeasonSlide } from './slides/SillySeasonSlide';
import { LeaderboardSlide } from './slides/LeaderboardSlide';
import { CarouselIndicators } from './CarouselIndicators';

export const FeatureCarousel = () => {
  const { currentSlide, goToSlide } = useCarousel({
    slideCount: 6,
    autoPlayInterval: 5000,
    pauseOnInteraction: true,
  });

  const slides = [
    <RacePredictionSlide key={1} />,
    <CrazyPredictionSlide key={2} />,
    <ValidationSlide key={3} />,
    <SeasonPredictionSlide key={4} />,
    <SillySeasonSlide key={5} />,
    <LeaderboardSlide key={6} />,
  ];

  return (
    <div
      className="relative w-full bg-paddock-darkgray rounded-lg overflow-hidden"
      role="region"
      aria-label="How it works carousel"
      aria-live="polite"
    >
      {/* Slide Container - Fixed height to prevent layout shifts */}
      <div className="relative h-[500px] sm:h-[550px] md:h-[600px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 overflow-hidden transition-all duration-500 ease-in-out scale-90 sm:scale-100 origin-top ${
              index === currentSlide
                ? 'opacity-100 translate-x-0'
                : index < currentSlide
                ? 'opacity-0 -translate-x-full'
                : 'opacity-0 translate-x-full'
            }`}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      <CarouselIndicators
        slideCount={6}
        currentSlide={currentSlide}
        onDotClick={goToSlide}
      />
    </div>
  );
};
