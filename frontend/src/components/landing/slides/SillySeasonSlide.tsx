export const SillySeasonSlide = () => {
  const drivers = [
    { name: 'Sergio Perez', checked: false },
    { name: 'Franco Colipinto', checked: true },
    { name: 'Liam Lawson', checked: false },
    { name: 'Fernando Alonso', checked: false },
  ];

  const teamPrincipals = [
    { name: 'Toto Wolff', checked: false },
    { name: 'Fred Vasseur', checked: true },
    { name: 'James Vowles', checked: false },
  ];

  return (
    <div className="flex flex-col items-center justify-start h-full px-4 sm:px-6 pt-8">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Predict the Silly Season
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-8 text-center max-w-2xl text-sm sm:text-base">
        Who will be sacked mid-season? Who will have their first race win? And who will be on the 2027 grid?
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-6 max-w-2xl w-full shadow-2xl space-y-4">
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Drivers Section */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">
              Mid-Season Driver Sackings
            </h4>
            <div className="space-y-2">
              {drivers.map((driver) => (
                <label
                  key={driver.name}
                  className="flex items-center gap-2 bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-2 cursor-pointer hover:border-paddock-red transition"
                >
                  <input
                    type="checkbox"
                    checked={driver.checked}
                    readOnly
                    className="w-4 h-4 rounded border-2 border-paddock-coral bg-transparent checked:bg-paddock-coral checked:border-paddock-coral cursor-pointer flex-shrink-0"
                  />
                  <span className="text-white text-xs">{driver.name}</span>
                </label>
              ))}
              {/* More indicator */}
              <div className="text-center text-gray-500 text-sm py-1">...</div>
            </div>
          </div>

          {/* Team Principals Section */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">
              Team Principal Departures
            </h4>
            <div className="space-y-2">
              {teamPrincipals.map((tp) => (
                <label
                  key={tp.name}
                  className="flex items-center gap-2 bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-2 cursor-pointer hover:border-paddock-red transition"
                >
                  <input
                    type="checkbox"
                    checked={tp.checked}
                    readOnly
                    className="w-4 h-4 rounded border-2 border-paddock-coral bg-transparent checked:bg-paddock-coral checked:border-paddock-coral cursor-pointer flex-shrink-0"
                  />
                  <span className="text-white text-xs">{tp.name}</span>
                </label>
              ))}
              {/* More indicator */}
              <div className="text-center text-gray-500 text-sm py-1">...</div>
            </div>
          </div>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center">
          📊 Select who you think will leave mid-season
        </p>
      </div>
    </div>
  );
};
