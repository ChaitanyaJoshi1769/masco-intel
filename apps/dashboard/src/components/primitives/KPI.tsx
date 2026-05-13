import React from 'react';

type KPIColor = 'cyan' | 'violet' | 'copper' | 'ok' | 'warn' | 'bad';
type DeltaDirection = 'up' | 'down' | 'neutral';

interface KPIProps {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaDir?: DeltaDirection;
  spark?: number[];
  color?: KPIColor;
  className?: string;
}

export const KPI: React.FC<KPIProps> = ({
  label,
  value,
  unit,
  delta,
  deltaDir = 'neutral',
  spark,
  color = 'cyan',
  className = '',
}) => {
  const colorVar = `--${color}`;
  const deltaColor = deltaDir === 'up' ? 'var(--ok)' : deltaDir === 'down' ? 'var(--bad)' : 'var(--ink-2)';

  return (
    <div className={`flex flex-col gap-3 p-4 hq-card ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <label className="text-xs text-ink-3 uppercase tracking-wider font-mono">{label}</label>
        {delta !== undefined && (
          <div className="flex items-center gap-1 text-xs font-mono" style={{ color: deltaColor }}>
            {deltaDir === 'up' && '↑'}
            {deltaDir === 'down' && '↓'}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold hq-num"
          style={{ color: `var(${colorVar})` }}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-ink-2">{unit}</span>}
      </div>

      {spark && <Sparkline points={spark} color={color} height={40} />}
    </div>
  );
};

interface SparklineProps {
  points: number[];
  color?: KPIColor;
  height?: number;
  width?: number;
  fill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  points,
  color = 'cyan',
  height = 24,
  width = 100,
  fill = true,
}) => {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const paddingX = 2;
  const paddingY = 2;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const xStep = graphWidth / (points.length - 1);
  const pathData = points
    .map((point, i) => {
      const x = paddingX + i * xStep;
      const y = paddingY + graphHeight - ((point - min) / range) * graphHeight;
      return i === 0 ? `M${x},${y}` : `L${x},${y}`;
    })
    .join(' ');

  const fillPath = fill
    ? `${pathData} L${paddingX + graphWidth},${paddingY + graphHeight} L${paddingX},${paddingY + graphHeight} Z`
    : null;

  const colorVar = `--${color}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {fillPath && (
        <path
          d={fillPath}
          fill={`var(${colorVar})`}
          opacity="0.12"
          className="hq-spark"
        />
      )}
      <path
        d={pathData}
        stroke={`var(${colorVar})`}
        strokeWidth="1.5"
        className="hq-spark"
      />
    </svg>
  );
};

Sparkline.displayName = 'Sparkline';
