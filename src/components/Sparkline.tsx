import React, { useState } from 'react';

interface DataPoint {
  day: string;
  value: number;
  label: string;
}

interface SparklineProps {
  data: DataPoint[];
  color: string;       // main line color hex (e.g. #65558f)
  gradientId: string;  // unique ID for linearGradient SVG element
  prefix?: string;
  suffix?: string;
}

export function Sparkline({ data, color, gradientId, prefix = '', suffix = '' }: SparklineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG settings
  const width = 240;
  const height = 48;
  const padding = 6;

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const valRange = maxVal - minVal || 1;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    // Invert Y so higher value is at top
    const y = height - padding - ((d.value - minVal) / valRange) * (height - padding * 2);
    return { x, y, ...d };
  });

  // Generate smooth cubic bezier line path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      // Control points for smooth curves
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
  }

  // Generate closed area path for the gradient fill
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  return (
    <div className="relative w-full h-12 mt-2 select-none group/sparkline">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className="overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal thin subtle helper lines */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#ece6f0" strokeDasharray="3,3" strokeWidth="0.5" />

        {/* Filled gradient area */}
        {areaD && (
          <path 
            d={areaD} 
            fill={`url(#${gradientId})`} 
            className="transition-all duration-300"
          />
        )}

        {/* Main continuous curve */}
        {pathD && (
          <path 
            d={pathD} 
            fill="none" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        )}

        {/* Hover vertical line tracking */}
        {hoveredIndex !== null && (
          <line
            x1={points[hoveredIndex].x}
            y1="0"
            x2={points[hoveredIndex].x}
            y2={height}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="2,2"
            className="opacity-70"
          />
        )}

        {/* Glowing live pulsating end dot if not hovering, or tracking dot if hovering */}
        {points.length > 0 && (
          (() => {
            const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];
            return (
              <g>
                <circle 
                  cx={activePoint.x} 
                  cy={activePoint.y} 
                  r="5" 
                  fill={color} 
                  className="animate-ping opacity-30" 
                />
                <circle 
                  cx={activePoint.x} 
                  cy={activePoint.y} 
                  r="3.5" 
                  fill={color} 
                  stroke="#ffffff" 
                  strokeWidth="1.5"
                  className="shadow-sm" 
                />
              </g>
            );
          })()
        )}

        {/* Hover capture slices */}
        {points.map((p, idx) => {
          const sliceWidth = width / points.length;
          const startX = p.x - sliceWidth / 2;
          return (
            <rect
              key={idx}
              x={startX}
              y="0"
              width={sliceWidth}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* Embedded professional Mini Tooltip popup */}
      <div 
        className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-mono px-2 py-1 rounded-md shadow-lg pointer-events-none transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap z-20 ${
          hoveredIndex !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <span className="opacity-80">{hoveredIndex !== null ? data[hoveredIndex].day : ''}:</span>
        <span className="font-bold">{prefix}{hoveredIndex !== null ? data[hoveredIndex].label : ''}{suffix}</span>
      </div>
    </div>
  );
}
