import { useCountdown } from '../../hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: string | Date;
  label: string;
}

export const CountdownTimer = ({ targetDate, label }: CountdownTimerProps) => {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate);

  if (isPast) {
    return (
      <div className="bg-paddock-gray p-6 rounded-lg text-center border border-paddock-lightgray">
        {label && <h3 className="text-xl font-bold text-gray-400 mb-2">{label}</h3>}
        <div className="text-paddock-red font-bold text-lg">
          DEADLINE PASSED
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {label && <h3 className="text-xl font-bold mb-4 text-white">{label}</h3>}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-black/40 rounded p-3">
          <div className="text-5xl font-bold text-white tabular-nums">{String(days).padStart(2, '0')}</div>
          <div className="text-xs mt-2 uppercase tracking-wider text-gray-400">Days</div>
        </div>
        <div className="bg-black/40 rounded p-3">
          <div className="text-5xl font-bold text-white tabular-nums">{String(hours).padStart(2, '0')}</div>
          <div className="text-xs mt-2 uppercase tracking-wider text-gray-400">Hrs</div>
        </div>
        <div className="bg-black/40 rounded p-3">
          <div className="text-5xl font-bold text-white tabular-nums">{String(minutes).padStart(2, '0')}</div>
          <div className="text-xs mt-2 uppercase tracking-wider text-gray-400">Min</div>
        </div>
        <div className="bg-black/40 rounded p-3">
          <div className="text-5xl font-bold text-white tabular-nums">{String(seconds).padStart(2, '0')}</div>
          <div className="text-xs mt-2 uppercase tracking-wider text-gray-400">Sec</div>
        </div>
      </div>
    </div>
  );
};
