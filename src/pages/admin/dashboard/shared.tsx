import React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, type Variants } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ChartColumn, Table2 } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';
import { useChartTheme } from '../../../hooks/useChartTheme';
import { cn } from '../../../lib/cn';

/* ─────────────────────────────────────────────────────────────
   Motion presets — cùng ngôn ngữ với PersonalPage (spring, lift, tilt)
   ───────────────────────────────────────────────────────────── */

export const EASE = [0.16, 1, 0.3, 1] as const;

export const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

export const card: Variants = {
    hidden: { opacity: 0, y: 26, scale: 0.97 },
    show:   { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

export const pop: Variants = {
    hidden: { opacity: 0, scale: 0.6 },
    show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 18 } },
};

export const hoverLift = {
    y: -4,
    transition: { type: 'spring' as const, stiffness: 320, damping: 22 },
};

/* ─────────────────────────────────────────────────────────────
   Format helpers
   ───────────────────────────────────────────────────────────── */

export const fmtInt = (n: number) => Math.round(n).toLocaleString('vi-VN');
export const fmtPct = (n: number, digits = 1) => `${n.toLocaleString('vi-VN', { maximumFractionDigits: digits })}%`;
/** 186500000 → "186,5M ₫" */
export const fmtMoney = (vnd: number) =>
    vnd >= 1_000_000
        ? `${(vnd / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M ₫`
        : `${Math.round(vnd / 1000)}k ₫`;
export const fmtDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};
export const fmtDateLong = (iso: string) =>
    new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(iso));

export const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric' }).format(new Date(iso));
};

/* ─────────────────────────────────────────────────────────────
   DashCard — card có lift khi hover, dùng cho mọi khối
   ───────────────────────────────────────────────────────────── */

type DashCardProps = React.ComponentProps<typeof motion.div> & {
    /** Không animate entrance (khi card nằm trong list đã có variants riêng) */
    still?: boolean;
};

export const DashCard = React.forwardRef<HTMLDivElement, DashCardProps>(({ className, still = false, children, ...props }, ref) => (
    <motion.div
        ref={ref}
        variants={still ? undefined : card}
        whileHover={hoverLift}
        className={cn(
            'relative flex flex-col rounded-2xl border border-line bg-surface shadow-card',
            'transition-[border-color,box-shadow] duration-300 hover:border-primary-300/60 hover:shadow-card-hover dark:hover:border-primary-500/35',
            className,
        )}
        {...props}
    >
        {children}
    </motion.div>
));
DashCard.displayName = 'DashCard';

interface CardTitleProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ title, description, action, className }) => (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)}>
        <div className="min-w-0">
            <h3 className="text-sm font-semibold text-fg leading-tight">{title}</h3>
            {description && (
                <p className="font-mono text-[11px] text-fg-muted mt-1.5 leading-snug">
                    <span className="text-fg-subtle select-none">{'// '}</span>{description}
                </p>
            )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
    </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn('px-5 pb-5 pt-4 flex-1 min-h-0', className)} {...props} />
);

/* ─────────────────────────────────────────────────────────────
   TiltCard — nghiêng 3D theo chuột + spotlight (từ PersonalPage, dịu hơn)
   ───────────────────────────────────────────────────────────── */

interface TiltCardProps {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    /** Độ nghiêng tối đa (độ) */
    max?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({ className, children, onClick, max = 6 }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 220, damping: 18 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 220, damping: 18 });
    const px = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
    const py = useTransform(y, [-0.5, 0.5], ['0%', '100%']);
    const spotlight = useMotionTemplate`radial-gradient(240px circle at ${px} ${py}, rgb(var(--color-primary-500) / 0.14), transparent 65%)`;

    const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
    };
    const reset = () => { x.set(0); y.set(0); };

    return (
        <motion.div
            variants={card}
            onMouseMove={onMove}
            onMouseLeave={reset}
            onClick={onClick}
            style={{ rotateX, rotateY, transformPerspective: 900 }}
            whileHover={{ y: -4 }}
            whileTap={onClick ? { scale: 0.985 } : undefined}
            className={cn(
                'group relative rounded-2xl border border-line bg-surface shadow-card overflow-hidden',
                'transition-[border-color,box-shadow] duration-300 hover:border-primary-300/70 hover:shadow-card-hover dark:hover:border-primary-500/40',
                onClick && 'cursor-pointer',
                className,
            )}
        >
            <motion.div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: spotlight }} />
            <div style={{ transform: 'translateZ(24px)' }} className="relative h-full">{children}</div>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Small pieces
   ───────────────────────────────────────────────────────────── */

export const Delta: React.FC<{ pct: number; upIsGood?: boolean; compareLabel?: string; className?: string }> = ({
    pct, upIsGood = true, compareLabel, className,
}) => {
    const up = pct >= 0;
    const good = up === upIsGood;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] text-fg-subtle', className)}>
            <span
                className={cn(
                    'inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md tabular-nums',
                    good
                        ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/15'
                        : 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/15',
                )}
            >
                <Icon className="w-3 h-3" />
                {Math.abs(pct).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
            </span>
            {compareLabel}
        </span>
    );
};

/** Sparkline 12 điểm — đường mờ, điểm cuối (kỳ hiện tại) nổi bật. */
export const Sparkline: React.FC<{ data: number[]; className?: string; width?: number; height?: number }> = ({
    data, className, width = 88, height = 30,
}) => {
    const theme = useChartTheme();
    const PAD = 4;
    const min = Math.min(...data), max = Math.max(...data);
    const pts = data.map((v, i) => {
        const x = PAD + (i / (data.length - 1)) * (width - PAD * 2);
        const y = PAD + (1 - (v - min) / (max - min || 1)) * (height - PAD * 2);
        return [x, y] as const;
    });
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const [lx, ly] = pts[pts.length - 1];
    const id = React.useId();

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} aria-hidden>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.series} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={theme.series} stopOpacity={0} />
                </linearGradient>
            </defs>
            <motion.path
                d={`${d} L${lx.toFixed(1)},${height - PAD} L${pts[0][0].toFixed(1)},${height - PAD} Z`}
                fill={`url(#${id})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
            />
            <motion.path
                d={d}
                fill="none"
                stroke={theme.series}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.45}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: EASE, delay: 0.25 }}
            />
            <motion.circle
                cx={lx} cy={ly} r={4}
                fill={theme.series} stroke={theme.surface} strokeWidth={2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 1.1 }}
                style={{ transformOrigin: `${lx}px ${ly}px` }}
            />
        </svg>
    );
};

export const ViewToggle: React.FC<{ view: 'chart' | 'table'; onChange: (v: 'chart' | 'table') => void }> = ({ view, onChange }) => (
    <div className="relative inline-flex items-center rounded-lg border border-line bg-surface-2/60 p-0.5" role="tablist" aria-label="Kiểu hiển thị">
        {([['chart', ChartColumn, 'Biểu đồ'], ['table', Table2, 'Bảng']] as const).map(([v, Icon, label]) => (
            <Tooltip key={v} content={label} side="bottom">
                <button
                    role="tab"
                    aria-selected={view === v}
                    aria-label={label}
                    onClick={() => onChange(v)}
                    className={cn('relative w-7 h-7 rounded-md flex items-center justify-center transition-colors', view === v ? 'text-fg' : 'text-fg-subtle hover:text-fg-2')}
                >
                    {view === v && (
                        <motion.span layoutId="view-toggle-pill" className="absolute inset-0 rounded-md bg-surface shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />
                    )}
                    <Icon className="relative w-3.5 h-3.5" />
                </button>
            </Tooltip>
        ))}
    </div>
);

/** Tiêu đề nhóm card — eyebrow dạng tag `<Vận hành />` (cùng motif với logo), hint dạng comment. */
export const SectionHeading: React.FC<{ eyebrow: string; title: string; hint?: string; right?: React.ReactNode }> = ({ eyebrow, title, hint, right }) => (
    <motion.div variants={card} className="flex items-end gap-4 mb-3 mt-2">
        <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium text-primary-600 dark:text-primary-300 whitespace-nowrap">
                <span className="text-fg-subtle">{'<'}</span>{eyebrow}<span className="text-fg-subtle">{' />'}</span>
            </p>
            <h2 className="text-base font-bold text-fg leading-tight mt-1">{title}</h2>
            {hint && (
                <p className="font-mono text-[11px] text-fg-muted mt-1">
                    <span className="text-fg-subtle select-none">{'// '}</span>{hint}
                </p>
            )}
        </div>
        {/* Đường kẻ nối tới mép phải, kiểu divider trong code: // ── Vận hành ── */}
        <div className="hidden sm:block flex-1 h-px mb-2 bg-gradient-to-r from-line to-transparent" aria-hidden />
        {right}
    </motion.div>
);

export const LegendKey: React.FC<{ color: string; label: string; muted?: boolean }> = ({ color, label, muted }) => (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-muted">
        <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color, opacity: muted ? 0.6 : 1 }} />
        {label}
    </span>
);

/** Thanh ngang 1 chuỗi, bo 4px ở đầu dữ liệu, vuông ở gốc. */
export const Bar: React.FC<{ pct: number; color?: string; delay?: number; className?: string; height?: number }> = ({
    pct, color, delay = 0, className, height = 8,
}) => {
    const theme = useChartTheme();
    return (
        <div className={cn('w-full rounded-r-[4px] bg-surface-2 overflow-hidden', className)} style={{ height }}>
            <motion.div
                className="h-full rounded-r-[4px]"
                style={{ backgroundColor: color ?? theme.series }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                transition={{ duration: 0.9, ease: EASE, delay }}
            />
        </div>
    );
};
