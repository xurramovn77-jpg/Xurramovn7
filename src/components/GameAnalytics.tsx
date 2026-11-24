import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CalendarDays, TrendingUp } from 'lucide-react';
import type { DailyEngagementPoint, NexplayGame } from '../types/nexplay';
import { buildGame7DayEngagement } from '../utils/nexplayLogic';

interface GameAnalyticsProps {
  game: NexplayGame;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: DailyEngagementPoint }>;
  label?: string;
}

const AnalyticsTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  const plays = Number(payload[0]?.value ?? 0);
  if (!item) return null;

  return (
    <div className="rounded-xl bg-[#070b15]/95 border border-white/[0.14] px-3.5 py-2.5 shadow-xl text-xs">
      <div className="text-slate-400 font-medium">{item.fullDate}</div>
      <div className="mt-1 flex items-center gap-2 font-semibold text-white tabular-nums">
        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" aria-hidden="true" />
        <span>{plays} ta start</span>
      </div>
    </div>
  );
};

export const GameAnalytics: React.FC<GameAnalyticsProps> = ({ game }) => {
  const series = useMemo(() => buildGame7DayEngagement(game), [game]);

  const metrics = useMemo(() => {
    const total7d = series.reduce((sum, pt) => sum + pt.plays, 0);
    const avgDaily = (total7d / 7).toFixed(1);
    let peakPoint = series[0];
    for (const pt of series) {
      if (pt.plays > (peakPoint?.plays ?? -1)) {
        peakPoint = pt;
      }
    }
    return {
      total7d,
      avgDaily,
      peakLabel: peakPoint ? `${peakPoint.label} (${peakPoint.plays})` : '0',
    };
  }, [series]);

  return (
    <section
      id="game-analytics-section"
      aria-labelledby="game-analytics-heading"
      className="nx-surface rounded-3xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="game-analytics-heading"
            className="font-heading font-bold text-lg sm:text-xl text-white flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5 text-cyan-300" />
            <span>So'nggi 7 kunlik faollik tahlili</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {game.title} o'yinining kunlik ishga tushirishlar dinamikasi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-400" />
              <span>7 kunlik jami</span>
            </div>
            <div className="font-heading font-bold text-base text-white tabular-nums mt-0.5">
              {metrics.total7d} start
            </div>
          </div>

          <div className="h-7 w-px bg-white/[0.08] hidden sm:block" aria-hidden="true" />

          <div>
            <div className="text-[11px] text-slate-400">Kunlik o'rtacha</div>
            <div className="font-heading font-bold text-base text-white tabular-nums mt-0.5">
              {metrics.avgDaily}
            </div>
          </div>

          <div className="h-7 w-px bg-white/[0.08] hidden sm:block" aria-hidden="true" />

          <div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-cyan-300" />
              <span>Eng faol kun</span>
            </div>
            <div className="font-heading font-bold text-base text-cyan-300 tabular-nums mt-0.5">
              {metrics.peakLabel}
            </div>
          </div>
        </div>
      </div>

      <div
        data-testid="game-analytics-chart"
        className="w-full min-w-0 h-[230px] sm:h-[250px] pt-2"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={200}>
          <LineChart data={series} margin={{ top: 10, right: 14, left: -16, bottom: 2 }}>
            <defs>
              <linearGradient id="nxEngagementStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="55%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(148, 163, 184, 0.1)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              content={<AnalyticsTooltip />}
              cursor={{ stroke: 'rgba(34, 211, 238, 0.28)', strokeWidth: 1.5 }}
            />
            <Line
              type="monotone"
              dataKey="plays"
              name="Startlar"
              stroke="url(#nxEngagementStroke)"
              strokeWidth={2.75}
              dot={{ r: 3.5, fill: '#0b101b', stroke: '#22d3ee', strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
