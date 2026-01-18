export const RacePredictionSlide = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Enter Your Race Predictions
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-8 text-center max-w-2xl text-sm sm:text-base">
        Before FP1 starts, predict the podium and find your midfield hero
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-6 max-w-2xl w-full shadow-2xl space-y-6">
        {/* Podium Display */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Podium Predictions
          </label>
          <div className="flex justify-center gap-6">
            {/* P1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <span className="text-white font-bold text-2xl">VER</span>
              </div>
              <span className="text-xs text-gray-300 font-bold">P1</span>
            </div>

            {/* P2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <span className="text-gray-800 font-bold text-2xl">NOR</span>
              </div>
              <span className="text-xs text-gray-300 font-bold">P2</span>
            </div>

            {/* P3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-b from-orange-500 to-orange-700 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <span className="text-white font-bold text-2xl">LEC</span>
              </div>
              <span className="text-xs text-gray-300 font-bold">P3</span>
            </div>
          </div>
        </div>

        {/* Pole Position */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Pole Position
          </label>
          <div className="relative">
            <input
              type="text"
              value="VER"
              readOnly
              className="w-full px-4 py-3 bg-paddock-darkgray border-2 border-paddock-red rounded-lg text-white font-bold"
            />
          </div>
        </div>

        {/* Midfield Hero */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Midfield Hero (P5-P10)
          </label>
          <div className="relative">
            <input
              type="text"
              value="ALO"
              readOnly
              className="w-full px-4 py-3 bg-paddock-darkgray border-2 border-paddock-coral rounded-lg text-white font-bold"
            />
            {/* Typing cursor animation */}
            <span className="absolute right-4 top-1/2 -translate-y-1/2 animate-pulse text-paddock-coral text-lg">
              |
            </span>
          </div>
        </div>

        {/* Hint Text */}
        <p className="text-xs text-gray-500 text-center">
          📊 Make your predictions before FP1 to score full points
        </p>
      </div>
    </div>
  );
};
