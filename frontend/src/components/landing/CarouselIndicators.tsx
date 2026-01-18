interface CarouselIndicatorsProps {
  slideCount: number;
  currentSlide: number;
  onDotClick: (index: number) => void;
}

export const CarouselIndicators = ({
  slideCount,
  currentSlide,
  onDotClick,
}: CarouselIndicatorsProps) => {
  return (
    <div className="flex justify-center gap-2 mt-6 md:mt-8">
      {Array.from({ length: slideCount }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`
            h-2.5 rounded-full transition-all duration-300 cursor-pointer
            ${
              index === currentSlide
                ? 'bg-paddock-red w-8'
                : 'bg-gray-500 w-2.5 hover:bg-gray-400'
            }
          `}
          aria-label={`Go to slide ${index + 1}`}
          type="button"
        />
      ))}
    </div>
  );
};
