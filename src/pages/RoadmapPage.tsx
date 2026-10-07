import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Pencil, Sparkles, Target, TrendingUp, PlayCircle, Waypoints, GitBranch, Terminal,
    BookOpen, Layers, ListVideo, Clock, ArrowRight,
} from 'lucide-react';
import AuthGuardModal from '../components/AuthGuardModal';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useMyCourses } from '../hooks/useMyCourses';
import { useAuthStore } from '../stores/authStore';
import RoadmapCreator from './RoadmapCreator';
import RoadmapStepCard, { type StepStatus } from '../components/RoadMapStepCard';
import roadmapService from '../services/roadmapService';
import { Button } from '../components/ui/Button';
import { MacWindow } from '../components/ui/MacWindow';
import { PageTitle } from '../components/ui/PageTitle';
import { TermCommand, TermKey, TermBar, TermStatGrid, type TermStatItem } from '../components/ui/Terminal';
import { container, card } from '../components/profile/ProfileKit';
import { formatDurationSeconds } from '../types/course';
import type { Roadmap, RoadmapCourse } from '../types/roadmap';
import { cn } from '../lib/cn';

/* ─────────────────────────────────────────────────────────────
   Lộ trình = nhánh main: tổng quan là cửa sổ terminal `roadmap status`,
   từng bước là commit trên `git log --graph`. Tiến độ lấy từ ghi danh thật.
   ───────────────────────────────────────────────────────────── */

interface Step { index: number; course: RoadmapCourse; status: StepStatus; progress: number }

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Lộ trình đang theo ───────────────────────────────────────────────────────

const ActiveRoadmap: React.FC<{ roadmap: Roadmap; onEdit: () => void }> = ({ roadmap, onEdit }) => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const enrollments = useMyCourses();

    // Ghép ghi danh vào từng bước: xong / đang học / chưa bắt đầu
    const steps = useMemo<Step[]>(() => {
        const byId = new Map(enrollments.map((e) => [e.courseId, e]));
        return [...roadmap.courses]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((course, index) => {
                const e = byId.get(course.id);
                const status: StepStatus = e?.isCompleted ? 'done' : e ? 'active' : 'todo';
                return { index, course, status, progress: e?.isCompleted ? 100 : e?.progress ?? 0 };
            });
    }, [roadmap.courses, enrollments]);

    const done = steps.filter((s) => s.status === 'done').length;
    const active = steps.filter((s) => s.status === 'active').length;
    const overall = steps.length ? Math.round(steps.reduce((sum, s) => sum + s.progress, 0) / steps.length) : 0;
    const head = steps.find((s) => s.status !== 'done') ?? null;

    const totals = useMemo(() => roadmap.courses.reduce(
        (t, c) => ({ chapters: t.chapters + c.chapterCount, lessons: t.lessons + c.lessonCount, seconds: t.seconds + c.totalDurationSeconds }),
        { chapters: 0, lessons: 0, seconds: 0 },
    ), [roadmap.courses]);

    const open = (s: Step) => navigate(s.status === 'todo' || !user ? `/courses/${s.course.id}` : `/courses/${s.course.id}/learn`);

    const stats: TermStatItem[] = [
        { icon: BookOpen,  k: 'courses',  label: 'Khóa học',    value: roadmap.courseCount },
        { icon: Layers,    k: 'chapters', label: 'Chương',      value: totals.chapters },
        { icon: ListVideo, k: 'lessons',  label: 'Bài học',     value: totals.lessons },
        { icon: Clock,     k: 'duration', label: 'Thời lượng',  value: formatDurationSeconds(totals.seconds) },
    ];

    return (
        <>
            {/* ── roadmap status ── */}
            <motion.div variants={card}>
                <MacWindow
                    title={<><Waypoints className="w-3.5 h-3.5 text-primary-500" /> roadmap — zsh</>}
                    right={
                        <Button size="xs" variant="secondary" onClick={onEdit}>
                            <Pencil className="w-3 h-3" /> Sửa lộ trình
                        </Button>
                    }
                    footer={
                        <>
                            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> main</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{done} done</span>
                            <span className="text-primary-600 dark:text-primary-300">{active} in progress</span>
                            <span>{steps.length - done - active} pending</span>
                            <span className="ml-auto text-fg-subtle">cập nhật {fmtDate(roadmap.updatedAt ?? roadmap.createdAt)}</span>
                        </>
                    }
                >
                    <TermCommand cmd="roadmap status" flags="--graph" />
                    <div className="p-5 sm:p-6">
                        <TermKey>lộ trình đang theo</TermKey>
                        <h2 className="mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight text-fg leading-tight">{roadmap.title}</h2>
                        {roadmap.description && <p className="mt-1.5 text-sm text-fg-muted leading-relaxed max-w-2xl">{roadmap.description}</p>}

                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                            <div className="flex items-center gap-3 font-mono text-[12px]">
                                <span className="text-fg-muted">progress</span>
                                <TermBar percent={overall} width={24} tone={overall >= 100 ? 'emerald' : 'primary'} />
                                <span className="font-semibold tabular-nums text-fg">{overall}%</span>
                                <span className="text-fg-subtle tabular-nums">{done}/{steps.length} khóa</span>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            {head ? (
                                <>
                                    <Button onClick={() => open(head)} className="group">
                                        <PlayCircle className="w-4 h-4" />
                                        {head.status === 'active' ? 'Tiếp tục học' : 'Bắt đầu học'}
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                    <span className="font-mono text-[12px] text-fg-muted truncate">
                                        <span className="text-emerald-500">➜</span> HEAD tại <span className="text-primary-600 dark:text-primary-300">step/{String(head.index + 1).padStart(2, '0')}</span> · {head.course.title}
                                    </span>
                                </>
                            ) : (
                                <span className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400">
                                    ✓ Đã hoàn thành toàn bộ lộ trình — chúc mừng!
                                </span>
                            )}
                        </div>
                    </div>
                    <TermStatGrid items={stats} className="border-t border-line" />
                </MacWindow>
            </motion.div>

            {/* ── git log --graph ── */}
            {steps.length > 0 && (
                <motion.div variants={card}>
                    <MacWindow
                        title={<><GitBranch className="w-3.5 h-3.5 text-fg-muted" /> git log --graph — main</>}
                        footer={
                            <>
                                <span className="tabular-nums">{steps.length} commits</span>
                                <span className="text-fg-subtle">·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{done} ✓</span>
                                {head && <><span className="text-fg-subtle">·</span><span>HEAD → step/{String(head.index + 1).padStart(2, '0')}</span></>}
                                <span className="ml-auto text-fg-subtle">~/roadmap/{roadmap.id}</span>
                            </>
                        }
                    >
                        <TermCommand cmd="git log" flags="--graph --oneline" />
                        <motion.ol
                            variants={container}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-40px' }}
                            className="p-4 sm:p-6"
                        >
                            {steps.map((s, i) => (
                                <RoadmapStepCard
                                    key={s.course.id}
                                    index={s.index}
                                    course={s.course}
                                    status={s.status}
                                    progress={s.progress}
                                    isLast={i === steps.length - 1}
                                    isHead={head?.course.id === s.course.id}
                                    onOpen={() => open(s)}
                                />
                            ))}
                        </motion.ol>
                    </MacWindow>
                </motion.div>
            )}
        </>
    );
};

// ─── Chưa có lộ trình ────────────────────────────────────────────────────────

const FEATURES = [
    { icon: Target,     label: 'Mục tiêu rõ ràng', sub: 'chọn ngôn ngữ & framework' },
    { icon: TrendingUp, label: 'Theo dõi tiến độ',  sub: 'từng bước, từng chương' },
    { icon: Sparkles,   label: 'Gợi ý khóa học',   sub: 'khớp với mục tiêu của bạn' },
];

const PREVIEW = ['ngôn ngữ', 'framework', 'khóa học'];

const EmptyRoadmap: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
    <motion.div variants={card}>
        <MacWindow
            title={<><Terminal className="w-3.5 h-3.5 text-fg-muted" /> roadmap — zsh</>}
            footer={<><span className="text-fg-subtle">➜</span> chưa có lộ trình · 0 khóa<span className="ml-auto text-fg-subtle">~/roadmap</span></>}
        >
            <TermCommand cmd="roadmap init" />
            <div className="grid lg:grid-cols-[1fr_16rem] gap-8 p-5 sm:p-8">
                <div className="min-w-0">
                    <TermKey>cá nhân hóa</TermKey>
                    <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-fg leading-tight">
                        Tạo lộ trình học tập của riêng bạn
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-fg-muted leading-relaxed max-w-xl">
                        Chọn ngôn ngữ, framework yêu thích và nhận đề xuất khóa học phù hợp. Theo dõi tiến độ từng bước để trở thành developer chuyên nghiệp.
                    </p>

                    <ul className="mt-5 space-y-2">
                        {FEATURES.map(({ icon: Icon, label, sub }) => (
                            <li key={label} className="flex items-center gap-3 text-sm">
                                <span className="flex w-8 h-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-primary-600 dark:text-primary-300">
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span className="text-fg-2 font-medium">{label}</span>
                                <span className="font-mono text-[11px] text-fg-subtle">{'// '}{sub}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Button size="lg" onClick={onCreate} className="group">
                            <Sparkles className="w-4 h-4" />
                            Tạo lộ trình ngay
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                        <span className="font-mono text-[12px] text-fg-subtle">chỉ mất ~1 phút</span>
                    </div>
                </div>

                {/* Xem trước graph — 3 node rỗng chờ commit đầu tiên */}
                <ol aria-hidden className="hidden lg:block self-center font-mono text-[12px]">
                    {PREVIEW.map((label, i) => (
                        <li key={label} className="flex gap-3">
                            <span className="flex flex-col items-center w-7">
                                <span className={cn('flex w-7 h-7 items-center justify-center rounded-full border-2 border-dashed border-line text-fg-subtle', i === 0 && 'border-primary-400 text-primary-600 dark:text-primary-300 animate-glow-pulse')}>
                                    {i + 1}
                                </span>
                                {i < PREVIEW.length - 1 && <span className="flex-1 min-h-[1.75rem] border-l-2 border-dashed border-line" />}
                            </span>
                            <span className="pt-1 text-fg-muted">
                                step/{String(i + 1).padStart(2, '0')} <span className="text-fg-subtle">· {label}</span>
                            </span>
                        </li>
                    ))}
                </ol>
            </div>
        </MacWindow>
    </motion.div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const RoadmapPage: React.FC = () => {
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatorOpen, setCreatorOpen] = useState(false);
    const { guardOpen, guardAction, closeGuard, requireAuth } = useAuthGuard();

    const fetchRoadmap = useCallback(async () => {
        setLoading(true);
        try {
            const res = await roadmapService.getRoadmaps({ count: true, top: 1 });
            setRoadmap(res.value?.[0] ?? null);
        } catch {
            setRoadmap(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

    const openCreator = () => requireAuth(() => setCreatorOpen(true), 'tạo lộ trình học tập cá nhân');

    return (
        <main className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6"
            >
                <motion.div variants={card}>
                    <PageTitle
                        path="roadmap"
                        title="Lộ trình học tập"
                        subtitle={roadmap ? 'Theo dõi và tiếp tục hành trình trở thành developer chuyên nghiệp' : 'Tạo lộ trình cá nhân và bắt đầu hành trình của bạn'}
                        right={!loading && !roadmap && (
                            <Button size="sm" onClick={openCreator}><Sparkles className="w-3.5 h-3.5" /> Tạo lộ trình</Button>
                        )}
                    />
                </motion.div>

                {loading ? (
                    <div className="space-y-6">
                        <div className="h-64 rounded-xl shimmer" />
                        <div className="h-96 rounded-xl shimmer" />
                    </div>
                ) : roadmap ? (
                    <ActiveRoadmap roadmap={roadmap} onEdit={openCreator} />
                ) : (
                    <EmptyRoadmap onCreate={openCreator} />
                )}
            </motion.div>

            <RoadmapCreator
                isOpen={creatorOpen}
                onClose={() => setCreatorOpen(false)}
                onCreated={setRoadmap}
            />

            <AuthGuardModal isOpen={guardOpen} onClose={closeGuard} action={guardAction} />
        </main>
    );
};

export default RoadmapPage;
