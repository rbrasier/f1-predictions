export const SillySeasonSlide = () => {
  const drivers = ['Perez', 'Tsunoda', 'Ricciardo', 'Alonso'];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Predict the Silly Season
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-8 text-center max-w-2xl text-sm sm:text-base">
        Who will be sacked mid-season? Pick your bold predictions!
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-6 max-w-2xl w-full shadow-2xl space-y-4">
        {/* Header */}
        <h4 className="text-white font-bold text-sm sm:text-base">
          Mid-Season Sackings
        </h4>

        {/* Driver Grid */}
        <div className="grid grid-cols-2 gap-3">
          {drivers.map((name) => (
            <div
              key={name}
              className="bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-4 text-center hover:border-paddock-red transition cursor-pointer"
            >
              <div className="w-14 h-14 bg-f1-red rounded-full mx-auto mb-2 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">
                  {name.substring(0, 3).toUpperCase()}
                </span>
              </div>
              <span className="text-white text-sm font-medium">{name}</span>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase">🔥 Categories:</p>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>• Drivers replaced by another driver</li>
            <li>• Team principal fired</li>
            <li>• Unexpected contract termination</li>
          </ul>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center">
          Pick drivers you think will be benched or replaced
        </p>
      </div>
    </div>
  );
};
