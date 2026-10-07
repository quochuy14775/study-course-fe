import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Clock, BookOpen, Award, PlayCircle, Lock } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { TermBar } from './ui/Terminal';
import { formatDurationSeconds } from '../types/course';
import type { RoadmapCourse } from '../types/roadmap';
import { cn } from '../lib/cn';

/* ─────────────────────────────────────────────────────────────
   Một bước của lộ trình = một commit trên nhánh main:
   node bên trái (✓ xong · số đang học · số chưa mở), card bên phải.
   ───────────────────────────────────────────────────────────── */

export type StepStatus = 'done' | 'active' | 'todo';

const LEVEL: Record<string, { label: string; variant: 'success' | 'warning' | 'primary' }> = {
    Beginner:     { label: 'Cơ bản',    variant: 'success' },
    Intermediate: { label: 'Trung cấp', variant: 'warning' },
    Advanced:     { label: 'Nâng cao',  variant: 'primary' },
};

const STATUS_META: Record<StepStatus, { label: string; cls: string }> = {
    done:   { label: 'hoàn thành', cls: 'text-emerald-600 dark:text-emerald-400' },
    active: { label: 'đang học',   cls: 'text-primary-600 dark:text-primary-300' },
    todo:   { label: 'chưa bắt đầu', cls: 'text-fg-subtle' },
};

const stepVariants = {
    hidden: { opacity: 0, x: -12 },
    show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

interface RoadmapStepCardProps {
    index: number;
    course: RoadmapCourse;
    status: StepStatus;
    /** 0–100, chỉ có ý nghĩa khi status = active */
    progress: number;
    isLast: boolean;
    /** Bước tiếp theo nên học (HEAD) — được nhấn mạnh */
    isHead: boolean;
    onOpen: () => void;
}

const MAX_CHAPTERS = 6;

const RoadmapStepCard: React.FC<RoadmapStepCardProps> = ({ index, course, status, progress, isLast, isHead, onOpen }) => {
    const level = LEVEL[course.level] ?? LEVEL.Beginner;
    const chapters = [...course.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
    const shown = chapters.slice(0, MAX_CHAPTERS);
    const more = chapters.length - shown.length;
    const tag = `step/${String(index + 1).padStart(2, '0')}`;

    return (
        <motion.li variants={stepVariants} className="flex gap-3 sm:gap-4">
            {/* ── Node + đường nối (git graph) ── */}
            <div className="flex flex-col items-center flex-shrink-0 w-8">
                <span
                    className={cn(
                        'flex w-8 h-8 items-center justify-center rounded-full font-mono text-[12px] font-bold ring-4 transition-colors',
                        status === 'done' && 'bg-emerald-500 text-white ring-emerald-500/20',
                        status === 'active' && 'bg-primary-600 text-white ring-primary-500/25',
                        status === 'active' && isHead && 'animate-glow-pulse',
                        status === 'todo' && 'bg-surface text-fg-muted ring-transparent border-2 border-line',
                    )}
                    aria-label={STATUS_META[status].label}
                >
                    {status === 'done' ? <Check className="w-4 h-4" strokeWidth={3} /> : index + 1}
                </span>
                {!isLast && (
                    <span
                        aria-hidden
                        className={cn(
                            'flex-1 mt-2 min-h-[2.5rem]',
                            status === 'done' ? 'w-0.5 bg-emerald-500' : 'w-0 border-l-2 border-dashed border-line',
                        )}
                    />
                )}
            </div>

            {/* ── Card ── */}
            <div className={cn('flex-1 min-w-0', isLast ? 'pb-1' : 'pb-6')}>
                <div
                    className={cn(
                        'group rounded-xl border bg-surface shadow-card p-4 sm:p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-card-hover',
                        isHead ? 'border-primary-300 dark:border-primary-500/40' : 'border-line hover:border-primary-300/60 dark:hover:border-primary-500/35',
                        status === 'todo' && !isHead && 'opacity-80',
                    )}
                >
                    {/* Header: tag · level · meta · status */}
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-fg-muted">
                        <span className={cn('px-1.5 h-5 inline-flex items-center rounded-md border', isHead ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/15 dark:text-primary-300' : 'border-line bg-surface-2 text-fg-2')}>
                            {tag}
                        </span>
                        {isHead && <span className="text-primary-600 dark:text-primary-300">← HEAD</span>}
                        <Badge variant={level.variant} size="sm" className="normal-case tracking-normal">{level.label}</Badge>
                        <span className="ml-auto flex items-center gap-3 tabular-nums">
                            {course.lessonCount > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessonCount} bài</span>}
                            {course.totalDurationSeconds > 0 && <span className="hidden sm:flex items-center gap-1"><Clock className="w-3 h-3" />{formatDurationSeconds(course.totalDurationSeconds)}</span>}
                            <span className={cn('flex items-center gap-1', STATUS_META[status].cls)}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', status === 'done' ? 'bg-emerald-500' : status === 'active' ? 'bg-primary-500 animate-pulse' : 'bg-fg-subtle')} />
                                {STATUS_META[status].label}
                            </span>
                        </span>
                    </div>

                    <h3 className="mt-2.5 text-[15px] sm:text-base font-bold tracking-tight text-fg leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                        {course.title}
                    </h3>
                    {course.description && <p className="mt-1 text-[13px] text-fg-muted leading-relaxed line-clamp-2">{course.description}</p>}

                    {/* Chương — cây thư mục */}
                    {shown.length > 0 && (
                        <ul className="mt-3 font-mono text-[11.5px] leading-6 text-fg-2">
                            {shown.map((ch, i) => (
                                <li key={ch.id} className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-fg-subtle select-none">{i === shown.length - 1 && more === 0 ? '└─' : '├─'}</span>
                                    <span className="truncate">{ch.title}</span>
                                </li>
                            ))}
                            {more > 0 && (
                                <li className="flex items-center gap-1.5 text-fg-subtle">
                                    <span className="select-none">└─</span>… còn {more} chương
                                </li>
                            )}
                        </ul>
                    )}

                    {/* Footer: tiến độ + hành động */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        {status === 'active' && (
                            <span className="flex items-center gap-2 font-mono text-[11px] text-fg-muted">
                                <TermBar percent={progress} width={16} tone="primary" />
                                <span className="tabular-nums text-fg-2">{Math.round(progress)}%</span>
                            </span>
                        )}
                        {status === 'done' && (
                            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                                <Award className="w-3.5 h-3.5" /> đã cấp chứng chỉ
                            </span>
                        )}
                        <Button
                            size="sm"
                            variant={status === 'done' ? 'secondary' : isHead ? 'primary' : 'soft'}
                            onClick={onOpen}
                            className="ml-auto group/btn"
                        >
                            {status === 'done' ? <>Xem lại</> : status === 'active' ? <><PlayCircle className="w-3.5 h-3.5" /> Tiếp tục</> : <>{!isHead && <Lock className="w-3.5 h-3.5" />} Bắt đầu học</>}
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.li>
    );
};

export default RoadmapStepCard;
