import { Driver } from '../../types';

interface DriverSelectorProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelect: (driverId: string) => void;
  label?: string;
  filterByTeamIds?: string[];
  required?: boolean;
}

export const DriverSelector = ({
  drivers,
  selectedDriverId,
  onSelect,
  label,
  filterByTeamIds,
  required = false
}: DriverSelectorProps) => {
  // Note: F1 API doesn't include team_id in driver data
  // Team filtering would need to be done at a higher level with team rosters
  const filteredDrivers = drivers;

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-bold text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
        {filteredDrivers.map((driver) => {
          const isSelected = driver.driverId === selectedDriverId;
          const fullName = `${driver.givenName} ${driver.familyName}`;

          return (
            <button
              key={driver.driverId}
              type="button"
              onClick={() => onSelect(driver.driverId)}
              className={`
                relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all
                ${isSelected
                  ? 'bg-paddock-red ring-2 ring-paddock-red ring-offset-2'
                  : 'bg-gray-100 hover:bg-gray-200 hover:ring-2 hover:ring-gray-300'
                }
              `}
              title={fullName}
            >
              {/* Driver Code Circle */}
              <div className="relative">
                <div
                  className={`
                    w-16 h-16 rounded-full border-2 transition-all flex items-center justify-center
                    ${isSelected ? 'border-white bg-white/20' : 'border-gray-300 bg-f1-red'}
                  `}
                >
                  <span className="text-white font-bold text-lg">
                    {driver.code || driver.familyName.substring(0, 3).toUpperCase()}
                  </span>
                </div>

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-paddock-red">
                    <svg
                      className="w-4 h-4 text-paddock-red"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>

              {/* Driver Name */}
              <div className="text-center w-full">
                <p className={`
                  text-xs font-medium line-clamp-2 leading-tight
                  ${isSelected ? 'text-white' : 'text-gray-900'}
                `}>
                  {fullName.split(' ').map((part: string, idx: number) => (
                    <span key={idx} className="block">
                      {part}
                    </span>
                  ))}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No drivers available
        </div>
      )}
    </div>
  );
};
