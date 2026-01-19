export const SeasonPredictionSlide = () => {
  const drivers = ['VER', 'NOR', 'LEC', 'PIA', 'SAI'];

  return (
    <div className="flex flex-col items-center justify-start h-full px-4 sm:px-6 pt-8">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Predict the Championship Order
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-6 text-center max-w-2xl text-sm sm:text-base">
        Predict the drivers' and constructors championship standings at the end of the season.
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-4 max-w-2xl w-full shadow-2xl space-y-2">
        {/* Header */}
        <h4 className="text-white font-bold text-sm mb-2">
          Drivers' Championship Order
        </h4>

        {/* Driver List */}
        <div className="space-y-1.5">
          {drivers.map((driver, index) => (
            <div
              key={driver}
              className="flex items-center gap-2 bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-2 cursor-move hover:border-paddock-red transition"
            >
              {/* Drag Handle */}
              <svg
                className="w-4 h-4 text-gray-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>

              {/* Position */}
              <span className="text-paddock-coral font-bold text-xs min-w-[1.5rem]">
                P{index + 1}
              </span>

              {/* Driver Badge */}
              <div className="w-8 h-8 bg-f1-red rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">{driver}</span>
              </div>

              {/* Driver Name */}
              <span className="text-white text-xs font-medium">
                {getDriverName(driver)}
              </span>
            </div>
          ))}
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center mt-2">
          📊 Drag drivers to reorder your predictions
        </p>
      </div>
    </div>
  );
};

function getDriverName(code: string): string {
  const drivers: Record<string, string> = {
    VER: 'Max Verstappen',
    NOR: 'Lando Norris',
    LEC: 'Charles Leclerc',
    PIA: 'Oscar Piastri',
    SAI: 'Carlos Sainz',
  };
  return drivers[code] || code;
}
