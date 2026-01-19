export const CrazyPredictionSlide = () => {
  return (
    <div className="flex flex-col items-center justify-start h-full px-4 sm:px-6 pt-8">
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
            value="Hadjar will beat Max in his first outing in the Red Bull"
            readOnly
            rows={4}
            className="w-full px-4 py-3 bg-paddock-darkgray border-2 border-purple-500 rounded-lg text-white resize-none text-sm sm:text-base"
          />
        </div>

        {/* Examples */}
        <div className="bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase">Other Examples:</p>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>• "Ocon will pass 3 cars on the first lap"</li>
            <li>• "More than one red flag before lap 20"</li>
            <li>• "All pit stops in the race under 2.8 seconds"</li>
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
