import React, { useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform, useMotionTemplate, type Variants } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

/* ─────────────────────────────────────────────────────────────
   Bộ card + motion dùng chung cho trang cá nhân (user & admin):
   spring stagger, tilt 3D, spotlight, sparkles, tone theo mục đích.
   ───────────────────────────────────────────────────────────── */

export const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
export const card: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
export const pop: Variants = {
    hidden: { opacity: 0, scale: 0.6 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 18 } },
};
export const hoverLift = { y: -5, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } };
export const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Tone theo mục đích card ─────────────────────────────────── */

export type Tone = 'primary' | 'amber' | 'emerald' | 'sky' | 'rose';

export const TONES: Record<Tone, {
    tile: string;    // icon tile gradient ở tiêu đề
    glow: string;    // vệt sáng góc card
    text: string;    // chữ nhấn
    hover: string;   // viền khi hover
    bar: string;     // thanh tiến độ
    line: string;    // đường sáng mảnh trên đỉnh card
    soft: string;    // nền nhạt cho chip / ô icon nhỏ
    mark: string;    // màu watermark
}> = {
    primary: {
        tile: 'from-primary-500 to-accent-600 shadow-glow-primary',
        glow: 'bg-primary-400/20 dark:bg-primary-500/15',
        text: 'text-primary-600 dark:text-primary-300',
        hover: 'hover:border-primary-300/70 dark:hover:border-primary-500/40',
        bar: 'from-primary-500 to-accent-500',
        line: 'via-primary-400/70',
        soft: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300',
        mark: 'text-primary-500',
    },
    amber: {
        tile: 'from-amber-400 to-orange-500 shadow-[0_0_16px_rgb(245_158_11/0.4)]',
        glow: 'bg-amber-400/25 dark:bg-amber-500/15',
        text: 'text-amber-600 dark:text-amber-300',
        hover: 'hover:border-amber-300/80 dark:hover:border-amber-500/40',
        bar: 'from-amber-400 to-orange-500',
        line: 'via-amber-400/80',
        soft: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
        mark: 'text-amber-500',
    },
    emerald: {
        tile: 'from-emerald-400 to-teal-500 shadow-[0_0_16px_rgb(16_185_129/0.4)]',
        glow: 'bg-emerald-400/20 dark:bg-emerald-500/15',
        text: 'text-emerald-600 dark:text-emerald-300',
        hover: 'hover:border-emerald-300/80 dark:hover:border-emerald-500/40',
        bar: 'from-emerald-400 to-teal-500',
        line: 'via-emerald-400/80',
        soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
        mark: 'text-emerald-500',
    },
    sky: {
        tile: 'from-sky-400 to-cyan-500 shadow-[0_0_16px_rgb(14_165_233/0.4)]',
        glow: 'bg-sky-400/20 dark:bg-sky-500/15',
        text: 'text-sky-600 dark:text-sky-300',
        hover: 'hover:border-sky-300/80 dark:hover:border-sky-500/40',
        bar: 'from-sky-400 to-cyan-500',
        line: 'via-sky-400/80',
        soft: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
        mark: 'text-sky-500',
    },
    rose: {
        tile: 'from-rose-400 to-pink-500 shadow-[0_0_16px_rgb(244_63_94/0.4)]',
        glow: 'bg-rose-400/20 dark:bg-rose-500/15',
        text: 'text-rose-600 dark:text-rose-300',
        hover: 'hover:border-rose-300/80 dark:hover:border-rose-500/40',
        bar: 'from-rose-400 to-pink-500',
        line: 'via-rose-400/80',
        soft: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
        mark: 'text-rose-500',
    },
};

/* ── Cards ───────────────────────────────────────────────────── */

/**
 * Card nghiêng 3D nhẹ theo chuột + spotlight. Không dùng translateZ (gây cảm giác phóng to
 * toàn card) — chỉ dành cho card lớn, ít phần tử tương tác bên trong (card hồ sơ).
 */
export const TiltCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 200, damping: 20 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 200, damping: 20 });
    const px = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
    const py = useTransform(y, [-0.5, 0.5], ['0%', '100%']);
    const spotlight = useMotionTemplate`radial-gradient(240px circle at ${px} ${py}, rgb(var(--color-primary-500) / 0.12), transparent 70%)`;

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
            style={{ rotateX, rotateY, transformPerspective: 1200 }}
            whileHover={{ y: -4 }}
            className={cn('relative rounded-2xl border border-line bg-surface shadow-card transition-[border-color,box-shadow] duration-300 hover:border-primary-300/70 hover:shadow-card-hover dark:hover:border-primary-500/40', className)}
        >
            <motion.div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: spotlight }} />
            <div className="relative h-full">{children}</div>
        </motion.div>
    );
};

interface LiftCardProps {
    tone?: Tone;
    /** Icon in mờ ở góc dưới phải — nhận diện mục đích card ngay cả khi lướt nhanh */
    watermark?: LucideIcon;
    className?: string;
    children: React.ReactNode;
}

/**
 * Card thường: nhấc nhẹ + sáng viền theo tone khi hover (không nghiêng 3D).
 * Có đường sáng mảnh trên đỉnh, vệt glow góc và watermark theo tone.
 */
export const LiftCard: React.FC<LiftCardProps> = ({ tone = 'primary', watermark: Mark, className, children }) => {
    const t = TONES[tone];
    return (
        <motion.div
            variants={card}
            whileHover={hoverLift}
            className={cn(
                'group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card',
                'transition-[border-color,box-shadow] duration-300 hover:shadow-card-hover',
                t.hover, className,
            )}
        >
            <span className={cn('pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent', t.line)} />
            <span className={cn('pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100', t.glow)} />
            {Mark && (
                <Mark
                    className={cn('pointer-events-none absolute -bottom-5 -right-4 w-28 h-28 opacity-[0.05] dark:opacity-[0.07] -rotate-12 transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-105', t.mark)}
                    strokeWidth={1.5}
                    aria-hidden
                />
            )}
            <div className="relative">{children}</div>
        </motion.div>
    );
};

/** Tiêu đề card: icon tile gradient theo tone + nhãn + mô tả. */
export const CardHeading: React.FC<{ tone: Tone; icon: LucideIcon; title: string; subtitle?: React.ReactNode; right?: React.ReactNode; className?: string }> = ({
    tone, icon: Icon, title, subtitle, right, className,
}) => {
    const t = TONES[tone];
    return (
        <div className={cn('flex items-start justify-between gap-3', className)}>
            <div className="flex items-center gap-3 min-w-0">
                <span className={cn('w-9 h-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center flex-shrink-0', t.tile)}>
                    <Icon className="w-4 h-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-fg uppercase tracking-wider">{title}</h3>
                    {subtitle && <p className="text-[11px] text-fg-muted mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>
            {right && <div className="flex-shrink-0">{right}</div>}
        </div>
    );
};

/** Ô số nhỏ theo tone, dùng trong lưới 2×2. */
export const StatTile: React.FC<{ tone: Tone; icon: LucideIcon; label: string; value: string | number; sub?: string }> = ({ tone, icon: Icon, label, value, sub }) => (
    <motion.div
        whileHover={hoverLift}
        className={cn('group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card p-4 transition-[border-color,box-shadow] duration-300 hover:shadow-card-hover', TONES[tone].hover)}
    >
        <span className={cn('pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100', TONES[tone].glow)} />
        <span className={cn('relative w-8 h-8 rounded-lg flex items-center justify-center mb-3', TONES[tone].soft)}>
            <Icon className="w-4 h-4" />
        </span>
        <p className="text-xl font-bold text-fg leading-none">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
            {sub && <span className="ml-1.5 text-[11px] font-medium text-fg-subtle">{sub}</span>}
        </p>
        <p className="text-[11px] text-fg-muted mt-1.5">{label}</p>
    </motion.div>
);

/* ── Trang trí ───────────────────────────────────────────────── */

/** Đốm sáng lấp lánh quanh một element (đặt trong parent `relative`). */
export const Sparkles: React.FC = () => {
    const dots = [
        { top: '-6px', left: '10%', d: 0 },
        { top: '50%', left: '-8px', d: 0.4 },
        { top: '-4px', right: '20%', d: 0.8 },
        { bottom: '-6px', left: '40%', d: 1.2 },
        { top: '40%', right: '-6px', d: 1.6 },
    ];
    return (
        <>
            {dots.map((s, i) => (
                <motion.span
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-orange-400"
                    style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom } as React.CSSProperties}
                    animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.6, delay: s.d, repeat: Infinity, repeatDelay: 0.6 }}
                />
            ))}
        </>
    );
};

/** Số đếm lên khi cuộn tới. */
export const AnimatedNumber: React.FC<{ value: number; format?: (n: number) => string }> = ({ value, format }) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const mv = useMotionValue(0);
    const spring = useSpring(mv, { stiffness: 80, damping: 20 });
    const [display, setDisplay] = useState('0');

    useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
    useEffect(() => spring.on('change', (v) => setDisplay(format ? format(Math.round(v)) : Math.round(v).toLocaleString('vi-VN'))), [spring, format]);

    return <span ref={ref}>{display}</span>;
};

/** Nền trang cá nhân: mesh chuyển động chậm + grid + 2 blob. */
export const ProfileBackdrop: React.FC = () => (
    <>
        <motion.div
            className="absolute inset-0 bg-gradient-mesh pointer-events-none"
            style={{ backgroundSize: '180% 180%' }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_65%)]" />
        <motion.div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-400/20 dark:bg-primary-500/10 blur-3xl pointer-events-none"
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
        />
        <motion.div
            className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-400/20 dark:bg-accent-500/10 blur-3xl pointer-events-none"
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
        />
    </>
);

/** Breadcrumb mono + tiêu đề gradient chạy. */
export const ProfileTitle: React.FC<{ path: string[]; title: string; right?: React.ReactNode }> = ({ path, title, right }) => (
    <motion.section variants={card}>
        <div className="flex items-center gap-2 text-xs font-mono text-primary-600 dark:text-primary-300 mb-2">
            <span className="text-fg-subtle">~/</span>
            {path.map((p, i) => (
                <React.Fragment key={p}>
                    {i > 0 && <span className="text-fg-subtle">/</span>}
                    <span>{p}</span>
                </React.Fragment>
            ))}
            <span className="inline-block w-1.5 h-3 bg-primary-600 dark:bg-primary-300 animate-blink" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
            <motion.h1
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent"
                style={{ backgroundSize: '200% auto' }}
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
            >
                {title}
            </motion.h1>
            {right}
        </div>
    </motion.section>
);

/* ── Helpers ─────────────────────────────────────────────────── */

export const fmtStudyTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h === 0) return `${m} phút`;
    return `${h}h ${String(m).padStart(2, '0')}m`;
};

export const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d} ngày trước`;
    return new Date(iso).toLocaleDateString('vi-VN');
};
