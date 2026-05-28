import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';

// Data types 
interface DailyStatPoint {
  date: string;
  day: string;
  dialogues: number;
  tokens: number;
  recallRate: number; // in %
  missRate: number;   // in %
  avgLatency: number; // in seconds
}

const GENERATED_7D_DATA: DailyStatPoint[] = [
  { date: '05-19', day: '周一', dialogues: 15240, tokens: 4.8, recallRate: 86.1, missRate: 13.9, avgLatency: 1.5 },
  { date: '05-20', day: '周二', dialogues: 17890, tokens: 5.6, recallRate: 87.4, missRate: 12.6, avgLatency: 1.4 },
  { date: '05-21', day: '周三', dialogues: 16420, tokens: 5.1, recallRate: 85.2, missRate: 14.8, avgLatency: 1.3 },
  { date: '05-22', day: '周四', dialogues: 19800, tokens: 6.2, recallRate: 88.3, missRate: 11.7, avgLatency: 1.25 },
  { date: '05-23', day: '周五', dialogues: 22140, tokens: 6.9, recallRate: 88.9, missRate: 11.1, avgLatency: 1.2 },
  { date: '05-24', day: '周六', dialogues: 14850, tokens: 4.5, recallRate: 89.1, missRate: 10.9, avgLatency: 1.15 },
  { date: '05-25', day: '今天', dialogues: 24592, tokens: 7.8, recallRate: 89.4, missRate: 10.6, avgLatency: 1.2 },
];

const GENERATED_30D_DATA: DailyStatPoint[] = Array.from({ length: 30 }).map((_, idx) => {
  const dayIndex = idx + 1;
  const daysBeforeToday = 30 - dayIndex;
  const d = new Date();
  d.setDate(d.getDate() - daysBeforeToday);
  const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayName = daysMap[d.getDay()];

  // Generates beautifully organic fluctuating values for a real running system
  const randomFactor = Math.sin(idx * 0.5) * 2000 + (idx * 150) + 12000;
  const dialogues = Math.round(randomFactor + Math.random() * 1500);
  const recallRate = parseFloat((84.0 + Math.sin(idx * 0.4) * 2.5 + Math.random() * 2).toFixed(1));
  const missRate = parseFloat((100 - recallRate).toFixed(1));
  
  return {
    date: dateStr,
    day: daysBeforeToday === 0 ? '今天' : dayName,
    dialogues,
    tokens: parseFloat((dialogues * 315 / 1000000).toFixed(1)), // Million tokens
    recallRate,
    missRate,
    avgLatency: parseFloat((1.5 - (idx * 0.01) + Math.random() * 0.2).toFixed(2)),
  };
});

export function AnalyticsCharts() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [activeMetric, setActiveMetric] = useState<'dialogues' | 'tokens' | 'recallRate' | 'avgLatency'>('dialogues');
  const [hoveredData, setHoveredData] = useState<DailyStatPoint | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Active dataset select
  const currentDataset = timeRange === '7d' ? GENERATED_7D_DATA : GENERATED_30D_DATA;

  // Summaries based on range
  const totalDialogues = currentDataset.reduce((sum, d) => sum + d.dialogues, 0);
  const totalTokens = currentDataset.reduce((sum, d) => sum + d.tokens, 0).toFixed(1);
  const avgRecallRate = (currentDataset.reduce((sum, d) => sum + d.recallRate, 0) / currentDataset.length).toFixed(1);
  const avgLatency = (currentDataset.reduce((sum, d) => sum + d.avgLatency, 0) / currentDataset.length).toFixed(2);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const leftPadding = 50;
  const rightPadding = 20;
  const topPadding = 20;
  const bottomPadding = 30;

  const chartWidth = svgWidth - leftPadding - rightPadding;
  const chartHeight = svgHeight - topPadding - bottomPadding;

  // Determine min and max Y for scaling
  let minVal = 0;
  let maxVal = 100;

  if (activeMetric === 'dialogues') {
    const vals = currentDataset.map(d => d.dialogues);
    minVal = Math.floor(Math.min(...vals) * 0.95);
    maxVal = Math.ceil(Math.max(...vals) * 1.05);
  } else if (activeMetric === 'tokens') {
    const vals = currentDataset.map(d => d.tokens);
    minVal = Math.max(0, parseFloat((Math.min(...vals) * 0.9).toFixed(1)));
    maxVal = parseFloat((Math.max(...vals) * 1.1).toFixed(1));
  } else if (activeMetric === 'recallRate') {
    const vals = currentDataset.map(d => d.recallRate);
    minVal = Math.floor(Math.min(...vals) - 3);
    maxVal = Math.ceil(Math.max(...vals) + 3);
  } else if (activeMetric === 'avgLatency') {
    const vals = currentDataset.map(d => d.avgLatency);
    minVal = parseFloat((Math.min(...vals) * 0.9).toFixed(2));
    maxVal = parseFloat((Math.max(...vals) * 1.1).toFixed(2));
  }

  const rangeY = (maxVal - minVal) || 1;

  // Core coordinates generator
  const coordinates = currentDataset.map((d, index) => {
    const x = leftPadding + (index / (currentDataset.length - 1)) * chartWidth;
    let actualVal = d.dialogues;
    if (activeMetric === 'tokens') actualVal = d.tokens;
    if (activeMetric === 'recallRate') actualVal = d.recallRate;
    if (activeMetric === 'avgLatency') actualVal = d.avgLatency;

    const y = topPadding + chartHeight - ((actualVal - minVal) / rangeY) * chartHeight;
    return { x, y, dataPoint: d };
  });

  // Calculate curve line path
  let pathD = '';
  if (coordinates.length > 0) {
    pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p0 = coordinates[i];
      const p1 = coordinates[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
  }

  const areaD = coordinates.length > 0
    ? `${pathD} L ${coordinates[coordinates.length - 1].x} ${topPadding + chartHeight} L ${coordinates[0].x} ${topPadding + chartHeight} Z`
    : '';

  // Grid line levels helper
  const gridLevels = 4;
  const gridStep = chartHeight / gridLevels;

  return (
    <div className="bg-surface-container-lowest border border-outline rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/50 pb-5">
        <div>
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Activity size={18} className="text-primary animate-pulse" />
            <span>运行效能与语义匹配量化监控</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">展示由大模型代理驱动的业务语义决策、拦截成功率、响应延时走势看板。</p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl self-start md:self-center">
          <button 
            type="button"
            onClick={() => {
              setTimeRange('7d');
              setHoveredData(null);
              setHoveredPointIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === '7d' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            近 7 天
          </button>
          <button 
            type="button"
            onClick={() => {
              setTimeRange('30d');
              setHoveredData(null);
              setHoveredPointIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === '30d' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            近 30 天
          </button>
        </div>
      </div>

      {/* Professional Mini-KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: 'dialogues' as const,
            title: '总服务对话量',
            value: totalDialogues.toLocaleString(),
            sub: '+12.4% 较上周',
            color: '#65558f',
            bg: 'bg-primary-container/30',
            active: activeMetric === 'dialogues',
            icon: CheckCircle2,
          },
          {
            key: 'tokens' as const,
            title: '模型消耗 Token',
            value: `${totalTokens}M`,
            sub: '+8.3% 耗用算力',
            color: '#625b71',
            bg: 'bg-secondary-container/30',
            active: activeMetric === 'tokens',
            icon: Zap,
          },
          {
            key: 'recallRate' as const,
            title: '平均语义查全召回率',
            value: `${avgRecallRate}%`,
            sub: '+1.2% 最优性能',
            color: '#2e7d32',
            bg: 'bg-success-beauty-green/10',
            active: activeMetric === 'recallRate',
            icon: Layers,
          },
          {
            key: 'avgLatency' as const,
            title: '端到端平均解时间',
            value: `${avgLatency}s`,
            sub: '-240ms 最优优化',
            color: '#ba1a1a',
            bg: 'bg-error-container/30',
            active: activeMetric === 'avgLatency',
            icon: Clock,
          }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.key}
              type="button"
              onClick={() => {
                setActiveMetric(kpi.key);
                setHoveredData(null);
                setHoveredPointIndex(null);
              }}
              className={`flex flex-col text-left p-4 rounded-2xl border transition-all hover:scale-102 hover:shadow-md ${
                kpi.active 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-outline-variant bg-surface-container-lowest hover:border-outline'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-1.5 rounded-lg ${kpi.active ? 'bg-primary/10 text-primary' : 'bg-surface text-on-surface-variant'}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="mt-2 text-xl font-extrabold text-on-surface tracking-tight font-mono">{kpi.value}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold ${kpi.key === 'avgLatency' ? 'text-success-beauty-green' : 'text-success-beauty-green'} flex items-center`}>
                  {kpi.key === 'avgLatency' ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                  {kpi.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Main interactive chart area (2/3 col) */}
        <div className="lg:col-span-2 border border-outline-variant p-4 rounded-2xl bg-surface-container-lowest space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeMetric === 'dialogues' ? '#65558f' : activeMetric === 'tokens' ? '#625b71' : activeMetric === 'recallRate' ? '#2e7d32' : '#ba1a1a' }}></span>
              <span className="text-xs font-bold text-on-surface">
                {activeMetric === 'dialogues' && '多轮场景对话周次执行密度'}
                {activeMetric === 'tokens' && '大型语言基础模型 Tokens 耗用走势'}
                {activeMetric === 'recallRate' && '企业级语义知识检索库查全召回率 (%)'}
                {activeMetric === 'avgLatency' && '网络节点请求返回平均业务时延 (秒)'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-on-surface-variant flex items-center gap-2">
              <span>Y-Axis: {minVal} ~ {maxVal}</span>
            </div>
          </div>

          <div className="relative w-full h-[220px]">
            <svg 
              width="100%" 
              height="100%" 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              <defs>
                <linearGradient id="main-metric-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor={
                      activeMetric === 'dialogues' ? '#65558f' :
                      activeMetric === 'tokens' ? '#625b71' :
                      activeMetric === 'recallRate' ? '#2e7d32' : '#ba1a1a'
                    } 
                    stopOpacity="0.25" 
                  />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {Array.from({ length: gridLevels + 1 }).map((_, i) => {
                const yPos = topPadding + i * gridStep;
                const valueLabel = maxVal - (i / gridLevels) * rangeY;
                return (
                  <g key={i}>
                    <line 
                      x1={leftPadding} 
                      y1={yPos} 
                      x2={svgWidth - rightPadding} 
                      y2={yPos} 
                      stroke="#e7e0ec" 
                      strokeDasharray="4,4" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={leftPadding - 8} 
                      y={yPos + 3} 
                      fontSize="9" 
                      fill="#79747e" 
                      textAnchor="end" 
                      fontFamily="mono"
                    >
                      {activeMetric === 'dialogues' ? Math.round(valueLabel).toLocaleString() : valueLabel.toFixed(activeMetric === 'avgLatency' ? 2 : 1)}
                    </text>
                  </g>
                );
              })}

              {/* Smooth Area Path */}
              {areaD && (
                <path 
                  d={areaD} 
                  fill="url(#main-metric-gradient)" 
                  className="transition-all duration-300"
                />
              )}

              {/* Main Line Stroke */}
              {pathD && (
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke={
                    activeMetric === 'dialogues' ? '#65558f' :
                    activeMetric === 'tokens' ? '#625b71' :
                    activeMetric === 'recallRate' ? '#2e7d32' : '#ba1a1a'
                  } 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Vertical dotted line tracking guide */}
              {hoveredPointIndex !== null && (
                <line 
                  x1={coordinates[hoveredPointIndex].x} 
                  y1={topPadding} 
                  x2={coordinates[hoveredPointIndex].x} 
                  y2={topPadding + chartHeight} 
                  stroke="#79747e" 
                  strokeWidth="1" 
                  strokeDasharray="3,3" 
                />
              )}

              {/* Data points mapping for visual circles */}
              {coordinates.map((pt, idx) => {
                const isActive = hoveredPointIndex === idx;
                const strokeColor = 
                  activeMetric === 'dialogues' ? '#65558f' :
                  activeMetric === 'tokens' ? '#625b71' :
                  activeMetric === 'recallRate' ? '#2e7d32' : '#ba1a1a';

                // Display only end-point dot or all dots if range is 7d (less congested)
                const shouldShowDot = isActive || (timeRange === '7d') || (idx % 4 === 0) || (idx === currentDataset.length - 1);

                if (!shouldShowDot) return null;

                return (
                  <g key={idx}>
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={isActive ? 6 : 4} 
                      fill={strokeColor} 
                      stroke="#ffffff" 
                      strokeWidth={isActive ? 2 : 1.5}
                      className="transition-all duration-150 shadow-sm"
                    />
                    {isActive && (
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="10" 
                        fill={strokeColor} 
                        fillOpacity="0.15" 
                        className="animate-ping" 
                      />
                    )}
                  </g>
                );
              })}

              {/* X-axis labels */}
              {currentDataset.map((pt, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === currentDataset.length - 1;
                const isNth = currentDataset.length > 10 ? (idx % 5 === 0) : true;
                const xPos = leftPadding + (idx / (currentDataset.length - 1)) * chartWidth;

                if (!isFirst && !isLast && !isNth) return null;

                return (
                  <text 
                    key={idx}
                    x={xPos} 
                    y={svgHeight - 8} 
                    fontSize="9" 
                    fill="#79747e" 
                    textAnchor="middle" 
                    fontFamily="sans"
                  >
                    {pt.date}
                  </text>
                );
              })}
            </svg>

            {/* Hover mouse move interaction capture slices */}
            <div className="absolute inset-0 flex" style={{ left: `${leftPadding}px`, right: `${rightPadding}px`, top: `${topPadding}px`, bottom: `${bottomPadding}px` }}>
              {currentDataset.map((pt, idx) => {
                return (
                  <div
                    key={idx}
                    className="flex-1 h-full cursor-crosshair"
                    onMouseEnter={() => {
                      setHoveredData(pt);
                      setHoveredPointIndex(idx);
                    }}
                    onMouseLeave={() => {
                      setHoveredData(null);
                      setHoveredPointIndex(null);
                    }}
                  />
                );
              })}
            </div>

            {/* Float Tooltip */}
            {hoveredData && hoveredPointIndex !== null && (
              <div 
                className="absolute bg-on-surface text-surface text-xs rounded-xl shadow-xl px-4 py-3 border border-outline-variant/30 pointer-events-none z-30 transition-all duration-100 space-y-1"
                style={{
                  left: `${Math.min(
                    svgWidth - 180, 
                    Math.max(20, leftPadding + (hoveredPointIndex / (currentDataset.length - 1)) * chartWidth - 80)
                  )}px`,
                  top: `${Math.min(130, Math.max(10, coordinates[hoveredPointIndex].y - 85))}px`,
                }}
              >
                <div className="font-bold border-b border-surface-container/20 pb-1.5 flex justify-between items-center gap-6">
                  <span className="text-secondary-container">{hoveredData.date} ({hoveredData.day})</span>
                  <span className="text-[10px] bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded uppercase font-bold font-mono">
                    {activeMetric}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono pt-1 text-[11px]">
                  <span className="text-surface-container-highest">服务对话:</span>
                  <span className="text-right text-surface font-black">{hoveredData.dialogues.toLocaleString()} 次</span>
                  
                  <span className="text-surface-container-highest">精准召回:</span>
                  <span className="text-right text-success-beauty-green font-black">{hoveredData.recallRate}%</span>
                  
                  <span className="text-surface-container-highest">消耗Token:</span>
                  <span className="text-right text-secondary-container font-black">{hoveredData.tokens}M</span>

                  <span className="text-surface-container-highest">业务时延:</span>
                  <span className="text-right text-error-container font-black">{hoveredData.avgLatency}s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Professional Knowledge deflections comparison breakdown */}
        <div className="border border-outline-variant p-4 rounded-2xl bg-surface-container-lowest flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">智能精准度与过滤诊断</h4>
              <span className="text-[10px] bg-success-beauty-green/10 text-success-beauty-green font-mono px-2 py-0.5 rounded-lg font-bold">自适应语义</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5">比对知识库完全独立答复（健康绿）与拦截、偏离未命中转人工（警戒红）。</p>
          </div>

          {/* Grouped Bar Stack Chart Representation */}
          <div className="h-44 relative w-full flex items-end pt-4">
            <svg width="100%" height="100%" viewBox="0 0 180 120" className="overflow-visible">
              {/* Reference Grid */}
              <line x1="0" y1="100" x2="180" y2="100" stroke="#e7e0ec" strokeWidth="1" />
              <line x1="0" y1="50" x2="180" y2="50" stroke="#e7e0ec" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="10" x2="180" y2="10" stroke="#e7e0ec" strokeDasharray="3,3" strokeWidth="0.5" />

              {/* Group Week 1 */}
              <g className="group/bar1 hover:opacity-100 transition-opacity">
                {/* Precision Answer */}
                <rect x="25" y="32" width="12" height="68" fill="#2e7d32" rx="2" className="hover:fill-success-beauty-green" />
                {/* Redirect Deflect */}
                <rect x="39" y="85" width="12" height="15" fill="#ba1a1a" rx="2" />
                <text x="38" y="112" fontSize="8" fill="#79747e" textAnchor="middle" fontWeight="bold">05.11-05.17</text>
                {/* Stack values labels */}
                <text x="31" y="26" fontSize="7" fill="#2e7d32" textAnchor="middle" fontWeight="black" className="opacity-0 group-hover/bar1:opacity-100 transition-opacity">86%</text>
                <text x="45" y="80" fontSize="7" fill="#ba1a1a" textAnchor="middle" fontWeight="black" className="opacity-0 group-hover/bar1:opacity-100 transition-opacity">14%</text>
              </g>

              {/* Group Week 2 */}
              <g className="group/bar2 hover:opacity-100 transition-opacity">
                {/* Precision Answer */}
                <rect x="80" y="24" width="12" height="76" fill="#2e7d32" rx="2" />
                {/* Redirect Deflect */}
                <rect x="94" y="88" width="12" height="12" fill="#ba1a1a" rx="2" />
                <text x="93" y="112" fontSize="8" fill="#79747e" textAnchor="middle" fontWeight="bold">05.18-05.24</text>
                {/* Stack values labels */}
                <text x="86" y="18" fontSize="7" fill="#2e7d32" textAnchor="middle" fontWeight="black" className="opacity-0 group-hover/bar2:opacity-100 transition-opacity">88%</text>
                <text x="100" y="83" fontSize="7" fill="#ba1a1a" textAnchor="middle" fontWeight="black" className="opacity-0 group-hover/bar2:opacity-100 transition-opacity">12%</text>
              </g>

              {/* Group Today */}
              <g className="group/bar3 hover:opacity-100 transition-opacity">
                {/* Precision Answer */}
                <rect x="135" y="18" width="12" height="82" fill="#65558f" rx="2" />
                {/* Redirect Deflect */}
                <rect x="149" y="91" width="12" height="9" fill="#ba1a1a" rx="2" />
                <text x="148" y="112" fontSize="8" fill="#1c1b21" textAnchor="middle" fontWeight="black">今日决策</text>
                {/* Stack values labels */}
                <text x="141" y="12" fontSize="7" fill="#65558f" textAnchor="middle" fontWeight="black" className="opacity-0 group-hover/bar3:opacity-100 transition-opacity">89%</text>
                <text x="155" y="86" fontSize="7" fill="#ba1a1a" textAnchor="middle" fontWeight="black" className="opacity-0 group-hover/bar3:opacity-100 transition-opacity">11%</text>
              </g>
            </svg>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/50">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-success-beauty-green"></span>
                <span className="text-on-surface-variant font-medium">精准语义知识召回答复</span>
              </div>
              <span className="font-mono font-bold text-on-surface">88.5% (均值)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-error"></span>
                <span className="text-on-surface-variant font-medium">未命中对话拦截/转人工</span>
              </div>
              <span className="font-mono font-bold text-on-surface">11.5% (降幅)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
