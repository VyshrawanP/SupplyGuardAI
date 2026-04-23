import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

function AnimatedValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const animated = useAnimatedNumber(value, 600);
  const display = Number.isInteger(value) ? Math.round(animated) : animated.toFixed(1);
  return <>{display}{suffix}</>;
}

export function MetricCard({ label, value, numericValue, suffix }: {
  label: string;
  value: string;
  numericValue?: number;
  suffix?: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>
        {numericValue !== undefined ? (
          <AnimatedValue value={numericValue} suffix={suffix} />
        ) : (
          value
        )}
      </strong>
    </div>
  );
}
