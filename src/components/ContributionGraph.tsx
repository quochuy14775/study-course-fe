import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

export interface ContributionDay {
    date: Date;
    /** Tổng hoạt động — quyết định màu ô */
    count: number;
    lessons?: number;
    quizzes?: number;
    posts?: number;
    enrollments?: number;
    certificates?: number;
}

interface ContributionGraphProps {
    /** Tăng dần theo ngày, phần tử cuối là hôm nay */
    contributions: ContributionDay[];
    title?: string;
    /** Dòng phụ bên dưới tiêu đề (vd. "128 hoạt động · 42 ngày học") */
    subtitle?: React.ReactNode;
    /** Nhãn "Dữ liệu mẫu" khi đang fallback */
    badge?: React.ReactNode;
    /** Tùy biến nội dung tooltip (mặc định: mô tả hoạt động học tập) */
    describe?: (day: ContributionDay) => string;
}

/* Bậc màu: 0 → nền, 1 → nhạt … 4+ → đậm. Dark mode đảo chiều để ô "nhiều" sáng lên trên nền tối. */
const LEVEL_CLASS = [
    'bg-surface-2',
    'bg-primary-200 dark:bg-primary-900',
    'bg-primary-400 dark:bg-primary-700',
    'bg-primary-600 dark:bg-primary-500',
    'bg-primary-800 dark:bg-primary-300',
];
const levelOf = (count: number) => Math.min(4, Math.max(0, count));

const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const DAY_LABELS = ['T2', 'T4', 'T6']; // chỉ hiện vài nhãn cho thoáng

const describeLearning = (d: ContributionDay): string => {
    if (d.count === 0) return 'Không có hoạt động';
    const parts: string[] = [];
    if (d.lessons) parts.push(`${d.lessons} bài học`);
    if (d.quizzes) parts.push(`${d.quizzes} lượt quiz`);
    if (d.posts) parts.push(`${d.posts} ghi chú/thảo luận`);
    if (d.enrollments) parts.push(`${d.enrollments} ghi danh`);
    if (d.certificates) parts.push(`${d.certificates} chứng chỉ`);
    return parts.length ? parts.join(' · ') : `${d.count} hoạt động`;
};

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
    contributions,
    title = 'Hoạt động học tập — 365 ngày',
    subtitle,
    badge,
    describe = describeLearning,
}) => {
    const [hovered, setHovered] = useState<ContributionDay | null>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    /* Gom 7 ngày một cột, canh cột đầu theo thứ trong tuần (T2 = hàng 0) để nhãn T2/T4/T6 đúng hàng */
    const weeks = useMemo(() => {
        if (contributions.length === 0) return [] as Array<Array<ContributionDay | null>>;
        const firstDow = (contributions[0].date.getDay() + 6) % 7; // 0 = T2 … 6 = CN
        const cells: Array<ContributionDay | null> = [...Array<null>(firstDow).fill(null), ...contributions];
        const out: Array<Array<ContributionDay | null>> = [];
        for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
        return out;
    }, [contributions]);

    const monthOf = (week: Array<ContributionDay | null>) => week.find((c) => c)?.date.getMonth();

    return (
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-card transition-[border-color,box-shadow] duration-300 hover:border-primary-300/70 hover:shadow-card-hover dark:hover:border-primary-500/40">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                    <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                        {title}
                        {badge}
                    </h3>
                    {subtitle && <p className="text-xs text-fg-muted mt-1">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-fg-subtle font-medium">Ít</span>
                    <div className="flex gap-1">
                        {LEVEL_CLASS.map((c) => <div key={c} className={cn('w-3 h-3 rounded-[2px]', c)} />)}
                    </div>
                    <span className="text-[10px] text-fg-subtle font-medium">Nhiều</span>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-2">
                <div className="flex gap-1.5 min-w-max">
                    {/* Nhãn thứ */}
                    <div className="flex flex-col gap-1 pt-4 mr-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <span key={i} className="text-[10px] text-fg-subtle h-3 leading-3">
                                {i % 2 === 0 ? DAY_LABELS[i / 2] : ''}
                            </span>
                        ))}
                    </div>

                    {/* Tuần */}
                    <div className="flex gap-1">
                        {weeks.map((week, wi) => {
                            const m = monthOf(week);
                            const showMonth = m !== undefined && (wi === 0 || monthOf(weeks[wi - 1]) !== m);
                            return (
                                <div key={wi} className="flex flex-col gap-1">
                                    <div className="h-3 text-[10px] leading-3 text-fg-subtle whitespace-nowrap">
                                        {showMonth ? MONTHS[m] : ''}
                                    </div>
                                    {week.map((day, di) =>
                                        day ? (
                                            <div
                                                key={di}
                                                role="img"
                                                aria-label={`${day.date.toLocaleDateString('vi-VN')}: ${describe(day)}`}
                                                className={cn(
                                                    'w-3 h-3 rounded-[2px] cursor-pointer transition-transform duration-150',
                                                    'hover:scale-125 hover:ring-2 hover:ring-surface hover:z-10',
                                                    LEVEL_CLASS[levelOf(day.count)],
                                                )}
                                                onMouseEnter={(e) => { setHovered(day); setMouse({ x: e.clientX, y: e.clientY }); }}
                                                onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
                                                onMouseLeave={() => setHovered(null)}
                                            />
                                        ) : (
                                            <div key={di} className="w-3 h-3" aria-hidden />
                                        ),
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {hovered && createPortal(
                    <div
                        className="fixed z-[80] px-3 py-2 rounded-lg text-xs shadow-soft-lg pointer-events-none bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900"
                        style={{ top: mouse.y - 52, left: mouse.x, transform: 'translateX(-50%)' }}
                    >
                        <div className="font-semibold capitalize">
                            {hovered.date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="opacity-80 mt-0.5">{describe(hovered)}</div>
                    </div>,
                    document.body,
                )}
            </div>
        </div>
    );
};
