export const RacePredictionSlide = () => {
  const podiumPredictions = [
    { label: 'P1', driver: 'VER', name: 'Max Verstappen' },
    { label: 'P2', driver: 'NOR', name: 'Lando Norris' },
    { label: 'P3', driver: 'LEC', name: 'Charles Leclerc' },
  ];

  return (
    <div className="flex flex-col items-center justify-start h-full px-4 sm:px-6 pt-8">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Enter Your Race Predictions
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-8 text-center max-w-2xl text-sm sm:text-base">
        Before FP1 starts, predict pole, podium, and your midfield hero
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-4 max-w-2xl w-full shadow-2xl space-y-2">
        

        {/* Pole Position */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Pole Position
          </label>
          <div className="flex items-center gap-2 bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-2">
            {/* Driver Badge */}
            <div className="w-8 h-8 bg-f1-red rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">VER</span>
            </div>

            {/* Driver Name */}
            <span className="text-white text-xs font-medium">
              Max Verstappen
            </span>
          </div>
        </div>

        {/* Podium Predictions */}
        <div className="space-y-1 pt-1">
          {podiumPredictions.map((prediction) => (
            <div
              key={prediction.label}
              className="flex items-center gap-2 bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-2 hover:border-paddock-red transition"
            >
              {/* Label */}
              <span className="text-paddock-coral font-bold text-xs min-w-[1.5rem]">
                {prediction.label}
              </span>

              {/* Driver Badge */}
              <div className="w-8 h-8 bg-f1-red rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">{prediction.driver}</span>
              </div>

              {/* Driver Name */}
              <span className="text-white text-xs font-medium">
                {prediction.name}
              </span>
            </div>
          ))}
        </div>

        {/* Midfield Hero with Autosuggest */}
        <div className="space-y-1 pt-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Midfield Hero
          </label>
          <div className="relative">
            {/* Input Field */}
            <div className="flex items-center gap-2 bg-paddock-darkgray border-2 border-paddock-coral rounded-lg p-2">
              <input
                type="text"
                value="fer"
                readOnly
                className="bg-transparent text-white text-xs font-medium outline-none w-full"
              />
              <span className="animate-pulse text-paddock-coral text-sm">|</span>
            </div>

            {/* Autosuggest Dropdown */}
            <div className="absolute top-full left-0 right-0 mt-1 bg-paddock-darkgray border border-paddock-lightgray rounded-lg shadow-lg z-10">
              <div className="flex items-center gap-2 p-2 hover:bg-paddock-gray cursor-pointer transition">
                {/* Driver Badge */}
                <div className="w-8 h-8 bg-f1-red rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">ALO</span>
                </div>

                {/* Driver Name */}
                <span className="text-white text-xs font-medium">
                  Fernando Alonso
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center mt-2">
          📊 Select drivers for each position to make your predictions
        </p>
      </div>
    </div>
  );
};
