export const ValidationSlide = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Validate Your Mates' Predictions
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-8 text-center max-w-2xl text-sm sm:text-base">
        Judge whether their crazy predictions are actually crazy enough
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-6 max-w-2xl w-full shadow-2xl space-y-4">
        {/* Prediction Card */}
        <div className="bg-paddock-darkgray border-2 border-purple-500 rounded-lg p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-f1-red rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">JohnDoe23</p>
              <p className="text-gray-400 text-xs">2 hours ago</p>
            </div>
          </div>

          {/* Prediction Text */}
          <p className="text-white text-sm sm:text-base">
            "Stroll will be the only team principal to get out and push his car in the pit lane"
          </p>
        </div>

        {/* Voting Buttons */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Is this crazy enough?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold transition text-sm sm:text-base">
              ✅ Legit
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-bold transition text-sm sm:text-base">
              🙄 Not Crazy Enough
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          Help decide which predictions are wild enough to count!
        </p>
      </div>
    </div>
  );
};
