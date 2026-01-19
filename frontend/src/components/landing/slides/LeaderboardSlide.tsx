export const LeaderboardSlide = () => {
  const leaderboard = [
    {
      rank: 1,
      name: 'SpeedKing99',
      points: 1847,
      bgGradient: 'from-yellow-600 to-yellow-700',
      medal: '🥇',
    },
    {
      rank: 2,
      name: 'F1Nostradamus',
      points: 1823,
      bgGradient: 'from-gray-400 to-gray-500',
      medal: '🥈',
    },
    {
      rank: 3,
      name: 'PitLanePredictor',
      points: 1798,
      bgGradient: 'from-orange-600 to-orange-700',
      medal: '🥉',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-start h-full px-4 sm:px-6 pt-8">
      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
        Battle for P1
      </h3>

      {/* Subtitle */}
      <p className="text-gray-400 mb-8 text-center max-w-2xl text-sm sm:text-base">
        See how you stack up against your mates at the end of the season
      </p>

      {/* Mockup Screen */}
      <div className="bg-paddock-gray border border-paddock-lightgray rounded-lg p-6 max-w-2xl w-full shadow-2xl space-y-3">
        {/* Header */}
        <h4 className="text-white font-bold text-center text-base sm:text-lg mb-4">
          🏆 Season Leaderboard
        </h4>

        {/* Leaderboard Entries */}
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r ${entry.bgGradient} shadow-md`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl font-bold text-white">
                  {entry.medal}
                </span>
                <div className="min-w-0">
                  <span className="text-white font-bold text-sm sm:text-base block">
                    {entry.name}
                  </span>
                  <span className="text-xs text-white/80">
                    #{entry.rank}
                  </span>
                </div>
              </div>
              <span className="text-white font-bold text-sm sm:text-base whitespace-nowrap ml-2">
                {entry.points} pts
              </span>
            </div>
          ))}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-400 text-center mt-4">
          📊 Points from season & race predictions combined
        </p>

        {/* CTA */}
        <div className="bg-paddock-darkgray border border-paddock-lightgray rounded-lg p-3 text-center">
          <p className="text-xs text-gray-300">
            Ready to climb the leaderboard? Join a league and start predicting! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};
