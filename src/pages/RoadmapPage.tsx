import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Sparkles, Target, TrendingUp, PlayCircle } from 'lucide-react';
import AuthGuardModal from '../components/AuthGuardModal';
import { useAuthGuard } from '../hooks/useAuthGuard';
import RoadmapCreator from './RoadmapCreator';
import RoadmapStepCard from '../components/RoadMapStepCard';
import roadmapService from '../services/roadmapService';
import type { Roadmap, RoadmapCourse } from '../types/roadmap';
import type { RoadmapStep } from '../types/roadmap';

// ─── helpers ──────────────────────────────────────────────────────────────────

const toStep = (course: RoadmapCourse, index: number): RoadmapStep => ({
    id: index + 1,
    title: `Bước ${index + 1}: ${course.title}`,
    description: course.description ?? '',
    topics: course.chapters.map((ch) => ch.title),
    difficulty: (course.level as RoadmapStep['difficulty']) ?? 'Beginner',
});

// ─── Active Roadmap Dashboard ─────────────────────────────────────────────────

interface ActiveRoadmapDashboardProps {
    roadmap: Roadmap;
    onEdit: () => void;
}

const ActiveRoadmapDashboard: React.FC<ActiveRoadmapDashboardProps> = ({ roadmap, onEdit }) => {
    const completedCount = 0;
    const progressPct = roadmap.courseCount > 0
        ? Math.round((completedCount / roadmap.courseCount) * 100)
        : 0;

    return (
        <div className="mb-10 animate-fade-in-up">
            {/* Hero card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-5 sm:p-8 text-white shadow-soft-lg">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium mb-3">
                            <Sparkles className="w-3 h-3" />
                            <span>Lộ trình đang theo</span>
                        </div>
                        <h2 className="text-xl sm:text-3xl font-extrabold mb-1 leading-tight">
                            Hành trình trở thành<br />
                            <span className="text-accent-300">Developer chuyên nghiệp</span>
                        </h2>
                        <p className="text-white/70 text-sm font-mono mt-2 mb-3">
                            {roadmap.courseCount} khóa học &nbsp;·&nbsp; {roadmap.courses.reduce((s, c) => s + c.chapterCount, 0)} chương &nbsp;·&nbsp; {completedCount}/{roadmap.courseCount} hoàn thành
                        </p>

                        {/* Progress bar */}
                        <div className="mt-5 max-w-md">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-white/70 font-mono">progress</span>
                                <span className="font-semibold font-mono">{progressPct}%</span>
                            </div>
                            <div className="h-2 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
                                <div
                                    className="h-full bg-gradient-to-r from-code-400 to-code-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgb(52,211,153,0.6)]"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-primary-700 font-semibold rounded-xl shadow-soft-lg hover:scale-105 active:scale-95 transition-transform">
                            <PlayCircle className="w-5 h-5" />
                            Tiếp tục học
                        </button>
                        <button
                            onClick={onEdit}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white font-medium rounded-xl hover:bg-white/20 backdrop-blur-sm transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            Sửa lộ trình
                        </button>
                    </div>
                </div>
            </div>

            {/* Step-by-step roadmap — Courses as steps, Chapters as topics */}
            {roadmap.courses.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold text-ink-900">Lộ trình từng bước</h3>
                        <span className="text-xs text-ink-500 font-mono">{roadmap.courseCount} khóa học</span>
                    </div>

                    {roadmap.courses.map((course, i) => (
                        <RoadmapStepCard
                            key={course.id}
                            step={toStep(course, i)}
                            isLast={i === roadmap.courses.length - 1}
                            onStartLearning={() => {}}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Empty state ───────────────────────────────────────────────────────────────

const EmptyHero: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-5 sm:p-8 lg:p-10 text-white shadow-soft-lg mb-10 animate-fade-in-up">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />

        <div className="absolute top-6 right-8 font-mono text-xs text-white/30 hidden lg:block">
            <span className="text-white/20">$</span> roadmap --init
        </div>

        <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium mb-4">
                <Target className="w-3 h-3" />
                <span>Cá nhân hóa</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 leading-tight">
                Tạo lộ trình học tập của riêng bạn
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed mb-6">
                Chọn ngôn ngữ, framework yêu thích và nhận đề xuất khóa học phù hợp. Theo dõi tiến độ và đạt mục tiêu trở thành developer chuyên nghiệp.
            </p>

            <button
                onClick={onCreate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl shadow-soft-lg hover:scale-105 active:scale-95 transition-transform"
            >
                <Sparkles className="w-5 h-5" />
                Tạo lộ trình ngay
            </button>

            <div className="flex flex-wrap gap-6 mt-8 text-sm">
                {[
                    { icon: Target, label: 'Mục tiêu rõ ràng' },
                    { icon: TrendingUp, label: 'Theo dõi tiến độ' },
                    { icon: Sparkles, label: 'Gợi ý AI' },
                ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-white/90">
                        <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                        </div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ─── RoadmapPage ──────────────────────────────────────────────────────────────

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

    const handleCreated = (newRoadmap: Roadmap) => {
        setRoadmap(newRoadmap);
    };

    const openCreator = () =>
        requireAuth(() => setCreatorOpen(true), 'tạo lộ trình học tập cá nhân');

    return (
        <main className="min-h-screen bg-ink-50 relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />

            <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* Page header */}
                <section className="mb-8 animate-fade-in-up">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                        <span className="text-ink-400">~/</span>
                        <span>roadmap</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900 mb-2 sm:mb-3">
                        Lộ trình học tập
                    </h1>
                    <p className="text-lg text-ink-600">
                        {roadmap
                            ? 'Theo dõi và tiếp tục hành trình trở thành developer chuyên nghiệp'
                            : 'Tạo lộ trình cá nhân và bắt đầu hành trình của bạn'}
                    </p>
                </section>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                    </div>
                ) : roadmap ? (
                    <ActiveRoadmapDashboard
                        roadmap={roadmap}
                        onEdit={openCreator}
                    />
                ) : (
                    <EmptyHero onCreate={openCreator} />
                )}
            </div>

            <RoadmapCreator
                isOpen={creatorOpen}
                onClose={() => setCreatorOpen(false)}
                onCreated={handleCreated}
            />

            <AuthGuardModal
                isOpen={guardOpen}
                onClose={closeGuard}
                action={guardAction}
            />
        </main>
    );
};

export default RoadmapPage;
