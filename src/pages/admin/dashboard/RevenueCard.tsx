import React, { useState } from 'react';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Sparkles as SparklesIcon } from 'lucide-react';
import { useChartTheme } from '../../../hooks/useChartTheme';
import { DashCard, CardTitle, CardBody, ViewToggle, Delta, fmtMoney, EASE } from './shared';
import { useDashboard } from './data';
import type { MonthlyRevenue } from '../../../mockDatas/mockAdminDashboard';

interface TooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; payload: MonthlyRevenue }>;
}

const ChartTip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const m = payload[0].payload;
    return (
        <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-soft-lg">
            <p className="text-[11px] text-fg-muted">Tháng {m.month.slice(5)}/{m.month.slice(0, 4)}{m.isCurrent ? ' · đang diễn ra' : ''}</p>
            <p className="text-sm font-semibold text-fg tabular-nums mt-0.5">{fmtMoney(m.value)}</p>
        </div>
    );
};

/**
 * Doanh thu 12 tháng — tháng hiện tại nhấn mạnh, các tháng cũ dịu lại; meter mục tiêu.
 * Chỉ render khi có dữ liệu (index.tsx ẩn card khi BE chưa có bảng thanh toán).
 */
const RevenueCard: React.FC = () => {
    const theme = useChartTheme();
    const { revenueMonthly: data, revenueTarget: target } = useDashboard();
    const [view, setView] = useState<'chart' | 'table'>('chart');
    if (!data || data.length < 2) return null;
    const revenueMonthly = data;
    const revenueTarget = target ?? 0;
    const current = revenueMonthly[revenueMonthly.length - 1];
    const prev = revenueMonthly[revenueMonthly.length - 2];
    const progress = revenueTarget > 0 ? Math.min(100, (current.value / revenueTarget) * 100) : 0;
    const reached = progress >= 100;

    return (
        <DashCard className="h-full">
            <CardTitle
                title="Doanh thu"
                description="12 tháng · tháng này đang diễn ra"
                action={<ViewToggle view={view} onChange={setView} />}
            />
            <CardBody className="flex flex-col">
                <div className="flex items-end justify-between gap-3 mb-3">
                    <div>
                        <NumberFlow
                            value={current.value / 1_000_000}
                            suffix=" M ₫"
                            format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                            locales="vi-VN"
                            className="block text-[1.75rem] font-bold tracking-tight text-fg leading-none"
                        />
                        <Delta pct={((current.value - prev.value) / prev.value) * 100} compareLabel="so với tháng trước" className="mt-1.5" />
                    </div>
                </div>

                {view === 'chart' ? (
                    <div className="h-[150px] -ml-2">
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={revenueMonthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="30%">
                                <CartesianGrid vertical={false} stroke={theme.grid} strokeWidth={1} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.textMuted }} axisLine={false} tickLine={false} tickMargin={6} interval={0} />
                                <YAxis width={34} tick={{ fontSize: 10, fill: theme.textMuted }} axisLine={false} tickLine={false} tickCount={3} tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`} />
                                <Tooltip content={<ChartTip />} cursor={{ fill: theme.grid, fillOpacity: 0.35 }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={900} animationEasing="ease-out">
                                    {revenueMonthly.map((m) => (
                                        // Nhấn mạnh tháng hiện tại; tháng cũ cùng hue nhưng dịu — quy tắc "emphasis"
                                        <Cell key={m.month} fill={theme.series} fillOpacity={m.isCurrent ? 1 : 0.4} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="max-h-[150px] overflow-auto rounded-xl border border-line">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-surface-2 text-fg-muted">
                                <tr>
                                    <th className="text-left font-medium px-3 py-1.5">Tháng</th>
                                    <th className="text-right font-medium px-3 py-1.5">Doanh thu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line-2">
                                {[...revenueMonthly].reverse().map((m) => (
                                    <tr key={m.month} className="hover:bg-surface-2/60">
                                        <td className="px-3 py-1.5 text-fg-2">{m.month.slice(5)}/{m.month.slice(0, 4)}{m.isCurrent && <span className="ml-1 text-[10px] text-primary-600">· nay</span>}</td>
                                        <td className="px-3 py-1.5 text-right font-medium text-fg tabular-nums">{fmtMoney(m.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Meter mục tiêu — track là bậc nhạt của cùng ramp */}
                <div className="mt-4 pt-4 border-t border-line-2">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="inline-flex items-center gap-1.5 text-fg-muted">
                            <Target className="w-3.5 h-3.5" /> Mục tiêu tháng {fmtMoney(revenueTarget)}
                        </span>
                        <span className="font-semibold text-fg tabular-nums inline-flex items-center gap-1">
                            {reached && <SparklesIcon className="w-3 h-3 text-amber-500" />}
                            <NumberFlow value={progress} suffix="%" format={{ maximumFractionDigits: 0 }} locales="vi-VN" />
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-primary-100 dark:bg-primary-500/20 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: theme.series }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.1, ease: EASE, delay: 0.4 }}
                        />
                    </div>
                    <p className="text-[10px] text-fg-subtle mt-1.5">Còn {fmtMoney(Math.max(0, revenueTarget - current.value))} · {new Date(2026, 9, 0).getDate() - 15} ngày nữa hết tháng</p>
                </div>
            </CardBody>
        </DashCard>
    );
};

export default RevenueCard;
