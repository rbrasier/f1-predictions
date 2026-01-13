import { useState, useRef, useEffect } from 'react';
import { Driver } from '../../types';

interface DriverAutocompleteProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelect: (driverId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const DriverAutocomplete = ({
  drivers,
  selectedDriverId,
  onSelect,
  label,
  placeholder = 'Type driver name...',
  required = false
}: DriverAutocompleteProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDriver = drivers.find(d => d.driverId === selectedDriverId);

  // Filter drivers based on search term
  const filteredDrivers = searchTerm.trim()
    ? drivers.filter(d => {
        const fullName = `${d.givenName} ${d.familyName}`;
        const searchLower = searchTerm.toLowerCase();
        return fullName.toLowerCase().includes(searchLower) ||
               d.familyName.toLowerCase().includes(searchLower) ||
               d.code?.toLowerCase().includes(searchLower);
      })
    : drivers;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredDrivers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredDrivers[highlightedIndex]) {
          handleSelect(filteredDrivers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (driver: Driver) => {
    onSelect(driver.driverId);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-bold text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={wrapperRef}>
        {/* Selected Driver Display */}
        {selectedDriver && !isOpen && (
          <div
            className="flex items-center gap-3 p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-f1-red transition"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0 bg-f1-red flex items-center justify-center">
              {selectedDriver.code ? (
                <span className="text-white font-bold text-xs">{selectedDriver.code}</span>
              ) : (
                <span className="text-white font-bold text-xs">F1</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900">{`${selectedDriver.givenName} ${selectedDriver.familyName}`}</div>
              {selectedDriver.code && (
                <div className="text-sm text-gray-600">#{selectedDriver.permanentNumber || selectedDriver.code}</div>
              )}
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Search Input */}
        {(!selectedDriver || isOpen) && (
          <div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-f1-red transition"
              autoComplete="off"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}

        {/* Dropdown Results */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filteredDrivers.length > 0 ? (
              <div className="py-1">
                {filteredDrivers.map((driver, index) => {
                const fullName = `${driver.givenName} ${driver.familyName}`;
                return (
                  <button
                    key={driver.driverId}
                    type="button"
                    onClick={() => handleSelect(driver)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2 text-left transition
                      ${index === highlightedIndex
                        ? 'bg-f1-red text-white'
                        : 'hover:bg-gray-100 text-gray-900'
                      }
                    `}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      index === highlightedIndex ? 'border-white bg-white/20' : 'border-gray-300 bg-f1-red'
                    }`}>
                      <span className={`font-bold text-xs ${
                        index === highlightedIndex ? 'text-white' : 'text-white'
                      }`}>
                        {driver.code || 'F1'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{fullName}</div>
                      {driver.permanentNumber && (
                        <div
                          className={`text-sm truncate ${
                            index === highlightedIndex ? 'text-white/90' : 'text-gray-600'
                          }`}
                        >
                          #{driver.permanentNumber}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              No drivers found matching "{searchTerm}"
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
