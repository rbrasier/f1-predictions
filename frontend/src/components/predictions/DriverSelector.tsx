import { Driver } from '../../types';

interface DriverSelectorProps {
  drivers: Driver[];
  selectedDriverId: number | null;
  onSelect: (driverId: number) => void;
  label?: string;
  filterByTeamIds?: number[];
  required?: boolean;
}

const DEFAULT_DRIVER_IMAGE = 'https://via.placeholder.com/80/E10600/FFFFFF?text=F1';

export const DriverSelector = ({
  drivers,
  selectedDriverId,
  onSelect,
  label,
  filterByTeamIds,
  required = false
}: DriverSelectorProps) => {
  // Filter drivers if team IDs are provided
  const filteredDrivers = filterByTeamIds
    ? drivers.filter(d => d.team_id && filterByTeamIds.includes(d.team_id))
    : drivers;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DEFAULT_DRIVER_IMAGE;
  };

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
          const isSelected = driver.id === selectedDriverId;

          return (
            <button
              key={driver.id}
              type="button"
              onClick={() => onSelect(driver.id)}
              className={`
                relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all
                ${isSelected
                  ? 'bg-paddock-red ring-2 ring-paddock-red ring-offset-2'
                  : 'bg-gray-100 hover:bg-gray-200 hover:ring-2 hover:ring-gray-300'
                }
              `}
              title={driver.name}
            >
              {/* Driver Image Circle */}
              <div className="relative">
                <div
                  className={`
                    w-16 h-16 rounded-full overflow-hidden border-2 transition-all
                    ${isSelected ? 'border-white' : 'border-gray-300'}
                  `}
                >
                  <img
                    src={driver.image_url || DEFAULT_DRIVER_IMAGE}
                    alt={driver.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
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
                  {driver.name.split(' ').map((part, idx) => (
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
