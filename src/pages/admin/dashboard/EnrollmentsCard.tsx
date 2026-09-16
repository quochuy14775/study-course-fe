import React, { useMemo, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '../../../hooks/useChartTheme';
import { DashCard, CardTitle, CardBody, ViewToggle, Delta, LegendKey, fmtInt, fmtDay, fmtDateLong } from './shared';
import { useDashboard } from './data';
import { sum, pctChange, RANGE_LABEL } from '../../../mockDatas/mockAdminDashboard';

interface Props {
    /** Số ghi danh cộng dồn từ live feed */
    liveBump?: number;
}

interface Row {
    date: string;
    prevDate: string;
    value: number;
    prev: number;
}

interface TooltipProps {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; payload: Row }>;
}

const ChartTip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
        <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-soft-lg min-w-[160px]">
            <p className="text-[11px] text-fg-muted capitalize">{fmtDateLong(row.date)}</p>
            <p className="text-sm font-semibold text-fg tabular-nums mt-0.5">{fmtInt(row.value)} ghi danh</p>
            <p className="text-[11px] text-fg-subtle tabular-nums mt-0.5">
                Kỳ trước ({fmtDay(row.prevDate)}): {fmtInt(row.prev)}
            </p>
        </div>
    );
};

/** Ghi danh theo ngày — hero figure của trang, có overlay kỳ trước và bảng số. */
const EnrollmentsCard: React.FC<Props> = ({ liveBump = 0 }) => {
    const theme = useChartTheme();
    const { range, daily: current, dailyPrevious: previous } = useDashboard();
    const [view, setView] = useState<'chart' | 'table'>('chart');

    const { rows, total, prevTotal, peak } = useMemo(() => {
        const rows: Row[] = current.map((p, i) => ({
            date: p.date,
            prevDate: previous[i]?.date ?? p.date,
            value: p.enrollments,
            prev: previous[i]?.enrollments ?? 0,
        }));
        const peak = rows.reduce((a, b) => (b.value > a.value ? b : a), rows[0] ?? { date: '', prevDate: '', value: 0, prev: 0 });
        return { rows, total: sum(current, 'enrollments'), prevTotal: sum(previous, 'enrollments'), peak };
    }, [current, previous]);

    const shownTotal = total + liveBump;

    return (
        <DashCard className="h-full">
            <CardTitle
                title="Ghi danh mới"
                description={`${RANGE_LABEL[range]} gần nhất · so với kỳ liền trước`}
                action={<ViewToggle view={view} onChange={setView} />}
            />
            <CardBody className="flex flex-col">
                {/* Hero figure — con số duy nhất được phóng to trên trang */}
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-3">
                    <div className="flex items-end gap-4">
                        <NumberFlow
                            value={shownTotal}
                            locales="vi-VN"
                            className="block text-5xl font-bold tracking-tight text-fg leading-none"
                        />
                        <div className="pb-1 space-y-1">
                            <Delta pct={pctChange(shownTotal, prevTotal)} compareLabel={`so với ${RANGE_LABEL[range]} trước`} />
                            {peak.date && <p className="text-[11px] text-fg-subtle">Đỉnh {fmtInt(peak.value)} vào {fmtDay(peak.date)}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pb-1">
                        <LegendKey color={theme.series} label="Kỳ này" />
                        <LegendKey color={theme.textMuted} label="Kỳ trước" muted />
                    </div>
                </div>

                {view === 'chart' ? (
                    <div className="flex-1 min-h-[240px] -ml-2">
                        <ResponsiveContainer width="100%" height={240}>
                            <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="enrollFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={theme.series} stopOpacity={0.22} />
                                        <stop offset="100%" stopColor={theme.series} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke={theme.grid} strokeWidth={1} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={fmtDay}
                                    tick={{ fontSize: 11, fill: theme.textMuted }}
                                    axisLine={false}
                                    tickLine={false}
                                    minTickGap={28}
                                    tickMargin={8}
                                />
                                <YAxis
                                    width={30}
                                    tick={{ fontSize: 11, fill: theme.textMuted }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickCount={4}
                                />
                                <Tooltip content={<ChartTip />} cursor={{ stroke: theme.textMuted, strokeWidth: 1, strokeOpacity: 0.5 }} />
                                {/* Kỳ trước — xám, mảnh, nằm dưới */}
                                <Line
                                    type="monotone"
                                    dataKey="prev"
                                    stroke={theme.textMuted}
                                    strokeWidth={1.5}
                                    strokeOpacity={0.7}
                                    dot={false}
                                    activeDot={{ r: 4, fill: theme.textMuted, stroke: theme.surface, strokeWidth: 2 }}
                                    animationDuration={900}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={theme.series}
                                    strokeWidth={2}
                                    fill="url(#enrollFill)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: theme.series, stroke: theme.surface, strokeWidth: 2 }}
                                    animationDuration={900}
                                    animationEasing="ease-out"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 max-h-[240px] overflow-auto rounded-xl border border-line">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-surface-2 text-fg-muted">
                                <tr>
                                    <th className="text-left font-medium px-3 py-2">Ngày</th>
                                    <th className="text-right font-medium px-3 py-2">Kỳ này</th>
                                    <th className="text-right font-medium px-3 py-2">Kỳ trước</th>
                                    <th className="text-right font-medium px-3 py-2">Δ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-2">
                                {[...rows].reverse().map((r) => {
                                    const d = r.value - r.prev;
                                    return (
                                        <tr key={r.date} className="hover:bg-surface-2/60">
                                            <td className="px-3 py-1.5 text-fg-2 capitalize">{fmtDateLong(r.date)}</td>
                                            <td className="px-3 py-1.5 text-right font-medium text-fg tabular-nums">{fmtInt(r.value)}</td>
                                            <td className="px-3 py-1.5 text-right text-fg-muted tabular-nums">{fmtInt(r.prev)}</td>
                                            <td className={`px-3 py-1.5 text-right tabular-nums ${d >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {d >= 0 ? '+' : ''}{fmtInt(d)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardBody>
        </DashCard>
    );
};

export default EnrollmentsCard;
