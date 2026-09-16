import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import { Clock, ArrowRight, Crown } from 'lucide-react';
import { useChartTheme } from '../../../hooks/useChartTheme';
import { cn } from '../../../lib/cn';
import { DashCard, CardTitle, CardBody, Bar, fmtInt, fmtMoney, EASE } from './shared';
import { useDashboard } from './data';
import { WEEKDAYS } from '../../../mockDatas/mockAdminDashboard';

/* ─────────────────────────────────────────────────────────────
   Heatmap giờ học — sequential 1 hue, 5 bậc; ô 0 lùi về surface
   ───────────────────────────────────────────────────────────── */

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export const HeatmapCard: React.FC = () => {
    const theme = useChartTheme();
    const { heatmap: studyHeatmap } = useDashboard();
    const [hover, setHover] = useState<{ d: number; h: number } | null>(null);

    const { max, peak } = useMemo(() => {
        let max = 0, peak = { d: 0, h: 0 };
        studyHeatmap.forEach((row, d) => row.forEach((v, h) => { if (v > max) { max = v; peak = { d, h }; } }));
        return { max, peak };
    }, [studyHeatmap]);

    // 5 bậc: 0 → surface-2, còn lại ramp primary (nhạt → đậm)
    const steps = ['rgb(var(--surface-2))', ...(theme.isDark
        ? ['rgb(var(--color-primary-900))', 'rgb(var(--color-primary-700))', 'rgb(var(--color-primary-500))', 'rgb(var(--color-primary-300))']
        : ['rgb(var(--color-primary-200))', 'rgb(var(--color-primary-400))', 'rgb(var(--color-primary-600))', 'rgb(var(--color-primary-800))'])];
    const color = (v: number) => {
        if (v === 0) return steps[0];
        const t = v / max;
        return steps[t < 0.25 ? 1 : t < 0.5 ? 2 : t < 0.75 ? 3 : 4];
    };

    const hovered = hover ? studyHeatmap[hover.d][hover.h] : null;

    return (
        <DashCard className="h-full">
            <CardTitle
                title="Giờ vàng học tập"
                description={max > 0 ? `Đỉnh ${WEEKDAYS[peak.d]} · ${peak.h}h–${peak.h + 1}h · ${fmtInt(max)} phiên · 90 ngày` : 'Chưa có dữ liệu xem bài · 90 ngày'}
                action={
                    <div className="flex items-center gap-1 text-[10px] text-fg-subtle">
                        ít
                        {steps.map((c, i) => <span key={i} className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: c }} />)}
                        nhiều
                    </div>
                }
            />
            <CardBody className="pt-3">
                <div className="grid gap-[3px]" style={{ gridTemplateColumns: '28px repeat(24, minmax(0, 1fr))' }} role="img" aria-label="Số phiên học theo thứ và giờ">
                    {/* Hàng nhãn giờ */}
                    <span />
                    {HOURS.map((h) => (
                        <span key={h} className="text-[9px] text-fg-subtle text-center leading-none tabular-nums">{h % 6 === 0 ? `${h}h` : ''}</span>
                    ))}
                    {studyHeatmap.map((row, d) => (
                        <React.Fragment key={d}>
                            <span className="text-[10px] font-medium text-fg-muted leading-none self-center">{WEEKDAYS[d]}</span>
                            {row.map((v, h) => (
                                <motion.button
                                    key={h}
                                    type="button"
                                    initial={{ opacity: 0, scale: 0.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.15 + (d * 24 + h) * 0.0025, duration: 0.25 }}
                                    onMouseEnter={() => setHover({ d, h })}
                                    onMouseLeave={() => setHover(null)}
                                    onFocus={() => setHover({ d, h })}
                                    onBlur={() => setHover(null)}
                                    aria-label={`${WEEKDAYS[d]} ${h}h: ${v} phiên`}
                                    className={cn('aspect-square w-full rounded-[3px] transition-transform hover:scale-125 hover:ring-2 hover:ring-surface hover:z-10 outline-none focus-visible:ring-2 focus-visible:ring-primary-500')}
                                    style={{ backgroundColor: color(v) }}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </div>
                <div className="mt-3 h-5 text-[11px] text-fg-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {hover && hovered !== null
                        ? <span><span className="font-semibold text-fg">{WEEKDAYS[hover.d]} {hover.h}h–{hover.h + 1}h</span> · {fmtInt(hovered)} phiên học</span>
                        : <span>Di chuột vào ô để xem chi tiết{max > 0 && ` · gợi ý gửi thông báo lúc ${Math.max(0, peak.h - 1)}h`}</span>}
                </div>
            </CardBody>
        </DashCard>
    );
};

/* ─────────────────────────────────────────────────────────────
   Funnel — 1 màu, thanh mọc lần lượt, % giữ lại giữa các bước
   ───────────────────────────────────────────────────────────── */

export const FunnelCard: React.FC = () => {
    const theme = useChartTheme();
    const { funnel, source } = useDashboard();
    const top = funnel[0]?.value ?? 0;
    const overall = top > 0 ? (funnel[funnel.length - 1].value / top) * 100 : 0;

    return (
        <DashCard className="h-full">
            <CardTitle
                title="Phễu chuyển đổi"
                description={source === 'api' ? 'Từ đăng ký tới chứng chỉ · toàn thời gian' : 'Từ đăng ký tới mua Pro · 90 ngày'}
                action={
                    <span className="text-right">
                        <span className="block text-lg font-bold text-fg leading-none tabular-nums">
                            <NumberFlow value={overall} suffix="%" format={{ maximumFractionDigits: 1 }} locales="vi-VN" />
                        </span>
                        <span className="text-[10px] text-fg-subtle">tổng chuyển đổi</span>
                    </span>
                }
            />
            <CardBody>
                <ol className="space-y-2.5">
                    {funnel.map((s, i) => {
                        const prev = i === 0 ? s.value : funnel[i - 1].value;
                        const keep = (s.value / prev) * 100;
                        const drop = 100 - keep;
                        return (
                            <li key={s.id}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-fg-2 font-medium">{s.label}</span>
                                    <span className="flex items-center gap-2 tabular-nums">
                                        {i > 0 && (
                                            <span className={cn('text-[10px]', drop > 40 ? 'text-rose-600 dark:text-rose-400' : 'text-fg-subtle')}>
                                                −{drop.toFixed(0)}%
                                            </span>
                                        )}
                                        <span className="font-semibold text-fg">{fmtInt(s.value)}</span>
                                    </span>
                                </div>
                                <Bar pct={top > 0 ? (s.value / top) * 100 : 0} color={theme.series} delay={0.2 + i * 0.09} height={10} />
                            </li>
                        );
                    })}
                </ol>
            </CardBody>
        </DashCard>
    );
};

/* ─────────────────────────────────────────────────────────────
   Top khóa học — bar list, giá trị ở đầu thanh, kèm doanh thu
   ───────────────────────────────────────────────────────────── */

export const TopCoursesCard: React.FC = () => {
    const navigate = useNavigate();
    const { topCourses, range } = useDashboard();
    const max = Math.max(1, ...topCourses.map((c) => c.enrollments));

    return (
        <DashCard className="h-full">
            <CardTitle title="Top khóa học" description={`Theo lượt ghi danh · ${range === '7d' ? '7' : range === '90d' ? '90' : '30'} ngày`} />
            <CardBody>
                {topCourses.length === 0 && <p className="py-8 text-center text-sm text-fg-subtle">Chưa có ghi danh trong kỳ.</p>}
                <ol className="space-y-3">
                    {topCourses.map((c, i) => (
                        <li key={c.id}>
                            <button onClick={() => navigate(`/courses/${c.id}`)} className="group w-full text-left">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={cn('w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums flex-shrink-0',
                                        i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-surface-2 text-fg-subtle')}>
                                        {i === 0 ? <Crown className="w-3 h-3" /> : i + 1}
                                    </span>
                                    <span className="flex-1 min-w-0 text-sm font-medium text-fg-2 truncate transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-300">{c.title}</span>
                                    {c.revenue > 0 && <span className="text-[10px] text-fg-subtle tabular-nums hidden sm:inline">{fmtMoney(c.revenue)}</span>}
                                    <span className="text-sm font-semibold text-fg tabular-nums">{fmtInt(c.enrollments)}</span>
                                </div>
                                <Bar pct={(c.enrollments / max) * 100} delay={0.25 + i * 0.06} className="ml-7 w-auto" />
                            </button>
                        </li>
                    ))}
                </ol>
            </CardBody>
        </DashCard>
    );
};

/* ─────────────────────────────────────────────────────────────
   Phân bố cấp độ — 1 thanh xếp chồng (ordinal 3 bậc) + legend
   ───────────────────────────────────────────────────────────── */

export const LevelCard: React.FC = () => {
    const theme = useChartTheme();
    const navigate = useNavigate();
    const { levelDistribution } = useDashboard();
    const total = levelDistribution.reduce((s, l) => s + l.count, 0);

    return (
        <DashCard className="h-full">
            <CardTitle title="Khóa học theo cấp độ" description={`${fmtInt(total)} khóa đang mở`} />
            <CardBody>
                <div className="flex h-3 w-full gap-[2px] rounded-full overflow-hidden" role="img" aria-label="Phân bố khóa học theo cấp độ">
                    {levelDistribution.map((l, i) => (
                        <motion.div
                            key={l.level}
                            initial={{ flexGrow: 0 }}
                            animate={{ flexGrow: l.count }}
                            transition={{ duration: 0.8, ease: EASE, delay: 0.2 + i * 0.05 }}
                            style={{ backgroundColor: theme.ordinal[i], flexBasis: 0 }}
                            className="h-full first:rounded-l-full last:rounded-r-full"
                        />
                    ))}
                </div>
                <ul className="mt-4 space-y-2">
                    {levelDistribution.map((l, i) => (
                        <li key={l.level}>
                            <button
                                onClick={() => navigate(`/management?level=${l.level}`)}
                                className="group w-full flex items-center gap-3 text-sm rounded-lg px-2 py-1.5 -mx-2 hover:bg-surface-2 transition-colors"
                            >
                                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.ordinal[i] }} />
                                <span className="flex-1 text-left text-fg-2">{l.label}</span>
                                <span className="font-semibold text-fg tabular-nums">{fmtInt(l.count)}</span>
                                <span className="w-10 text-right text-xs text-fg-subtle tabular-nums">{total > 0 ? Math.round((l.count / total) * 100) : 0}%</span>
                                <ArrowRight className="w-3 h-3 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </li>
                    ))}
                </ul>
            </CardBody>
        </DashCard>
    );
};
