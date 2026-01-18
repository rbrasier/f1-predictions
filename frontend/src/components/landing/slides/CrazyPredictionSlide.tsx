export const CrazyPredictionSlide = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Enter Your Crazy Prediction
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-8 text-center max-w-2xl text-sm sm:text-base">
        Make a bold claim about what will happen during the race
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-6 max-w-2xl w-full shadow-2xl space-y-4">
        {/* Header */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            🎭 Your Crazy Prediction
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Something wild that might actually happen
          </p>
        </div>

        {/* Input Field */}
        <div>
          <textarea
            value="Bearman will score his first podium this weekend"
            readOnly
            rows={4}
            className="w-full px-4 py-3 bg-paddock-darkgray border-2 border-purple-500 rounded-lg text-white resize-none text-sm sm:text-base"
          />
        </div>

        {/* Examples */}
        <div className="bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase">Other Examples:</p>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>• "Ricciardo will pass 3 cars on the first lap"</li>
            <li>• "Safety car will come out before lap 10"</li>
            <li>• "Qualifying will be wet"</li>
          </ul>
        </div>

        {/* Submit Hint */}
        <p className="text-xs text-gray-500 text-center">
          🚀 Make it bold enough to challenge your mates!
        </p>
      </div>
    </div>
  );
};
