import { useCountdown } from '../../hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: string | Date;
  label: string;
}

export const CountdownTimer = ({ targetDate, label }: CountdownTimerProps) => {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate);

  if (isPast) {
    return (
      <div className="bg-gray-200 p-6 rounded-lg text-center">
        <h3 className="text-xl font-bold text-gray-600 mb-2">{label}</h3>
        <div className="text-red-600 font-bold text-lg">
          DEADLINE PASSED
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-f1-red to-red-700 p-6 rounded-lg text-white text-center shadow-lg">
      <h3 className="text-xl font-bold mb-4">{label}</h3>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-4xl font-bold">{days}</div>
          <div className="text-sm mt-1">Days</div>
        </div>
        <div>
          <div className="text-4xl font-bold">{hours}</div>
          <div className="text-sm mt-1">Hours</div>
        </div>
        <div>
          <div className="text-4xl font-bold">{minutes}</div>
          <div className="text-sm mt-1">Minutes</div>
        </div>
        <div>
          <div className="text-4xl font-bold">{seconds}</div>
          <div className="text-sm mt-1">Seconds</div>
        </div>
      </div>
    </div>
  );
};
