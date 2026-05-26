import React from 'react';
import { Pencil, BookOpen, Sparkles, Target, Clock, TrendingUp, PlayCircle, ChevronRight } from 'lucide-react';
import { COURSES, FRAMEWORKS, LANGUAGES, ROADMAP_STEPS } from "../mockDatas/mockRoadMap";
import { useCourseRecommendation } from "../hooks/useCourseRecommendation";
import RoadmapStepCard from "../components/RoadMapStepCard";
import CourseRecommendationModal from "../components/CourseRecommendationModal";

// ---------------------------------------------------------------------------
// Active Roadmap Dashboard — shown when user has saved a roadmap
// ---------------------------------------------------------------------------

interface ActiveRoadmapDashboardProps {
    langId: string;
    frameworkId: string;
    selectedCourseIds: string[];
    onEdit: () => void;
}

const ActiveRoadmapDashboard: React.FC<ActiveRoadmapDashboardProps> = ({
    langId,
    frameworkId,
    selectedCourseIds,
    onEdit,
}) => {
    const langLabel = LANGUAGES.find((l) => l.id === langId)?.label ?? langId;
    const fwLabel = (FRAMEWORKS[langId] ?? []).find((f) => f.id === frameworkId)?.label ?? frameworkId;
    const courses = COURSES.filter((c) => selectedCourseIds.includes(c.id));
    // Mock progress — replace when real data available
    const completedCount = 0;
    const progressPct = courses.length > 0 ? Math.round((completedCount / courses.length) * 100) : 0;

    return (
        <div className="mb-10 animate-fade-in-up">
            {/* Hero card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 text-white shadow-soft-lg">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium mb-3">
                            <Sparkles className="w-3 h-3" />
                            <span>Lộ trình đang theo</span>
                        </div>
                        <h2 className="text-3xl font-extrabold mb-2">
                            <span className="font-mono">{langLabel}</span>
                            <span className="text-white/60 mx-2">·</span>
                            <span className="font-mono">{fwLabel}</span>
                        </h2>
                        <p className="text-white/80">
                            {courses.length} khóa học · {completedCount}/{courses.length} hoàn thành
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
                        <button
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-primary-700 font-semibold rounded-xl shadow-soft-lg hover:scale-105 active:scale-95 transition-transform"
                        >
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

            {/* Courses in roadmap */}
            {courses.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-ink-900">Khóa học trong lộ trình</h3>
                        <span className="text-xs text-ink-500 font-mono">{courses.length} courses</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {courses.map((course, i) => (
                            <button
                                key={course.id}
                                className="card-lift text-left flex items-start gap-3 p-4 bg-white border border-ink-200 rounded-2xl shadow-soft group animate-fade-in-up"
                                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-ink-900 group-hover:text-primary-700 transition-colors truncate">
                                        {course.title}
                                    </p>
                                    <p className="text-xs text-ink-500 mt-1 line-clamp-2">{course.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-ink-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {course.duration}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-ink-100 text-ink-600 font-mono text-[10px]">
                                            {course.level}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-ink-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Empty state — user has no roadmap yet
// ---------------------------------------------------------------------------

interface EmptyHeroProps {
    onCreate: () => void;
}

const EmptyHero: React.FC<EmptyHeroProps> = ({ onCreate }) => (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 lg:p-10 text-white shadow-soft-lg mb-10 animate-fade-in-up">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />

        {/* Code-style decorator */}
        <div className="absolute top-6 right-8 font-mono text-xs text-white/30 hidden lg:block">
            <span className="text-white/20">$</span> roadmap --init
        </div>

        <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium mb-4">
                <Target className="w-3 h-3" />
                <span>Cá nhân hóa</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight">
                Tạo lộ trình học tập của riêng bạn
            </h2>
            <p className="text-base lg:text-lg text-white/85 leading-relaxed mb-6">
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
                <div className="flex items-center gap-2 text-white/90">
                    <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                        <Target className="w-4 h-4" />
                    </div>
                    <span>Mục tiêu rõ ràng</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                    <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <span>Theo dõi tiến độ</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                    <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span>Gợi ý AI</span>
                </div>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// RoadmapPage
// ---------------------------------------------------------------------------

const RoadmapPage: React.FC = () => {
    const {
        isModalOpen,
        currentStep,
        selectedLangId,
        selectedFrameworkId,
        selectedCourseIds,
        savedRoadmap,
        openModal,
        closeModal,
        setLanguage,
        setFramework,
        toggleCourse,
        goNextStep,
        goPrevStep,
        handleAccept,
    } = useCourseRecommendation();

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
                        {savedRoadmap
                            ? 'Theo dõi và tiếp tục hành trình trở thành developer chuyên nghiệp'
                            : 'Tạo lộ trình cá nhân và bắt đầu hành trình của bạn'}
                    </p>
                </section>

                {/* Active dashboard OR empty hero */}
                {savedRoadmap ? (
                    <ActiveRoadmapDashboard
                        langId={savedRoadmap.langId}
                        frameworkId={savedRoadmap.frameworkId}
                        selectedCourseIds={savedRoadmap.selectedCourseIds}
                        onEdit={() => openModal()}
                    />
                ) : (
                    <EmptyHero onCreate={() => openModal()} />
                )}

                {/* Roadmap timeline section */}
                <section className="animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-ink-900">Các giai đoạn phát triển</h2>
                            <p className="text-sm text-ink-500 mt-1">Tham khảo lộ trình chung từ Beginner đến Expert</p>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-ink-200 text-xs font-mono text-ink-600">
                            {ROADMAP_STEPS.length} stages
                        </span>
                    </div>

                    <div>
                        {ROADMAP_STEPS.map((step, index) => (
                            <RoadmapStepCard
                                key={step.id}
                                step={step}
                                isLast={index === ROADMAP_STEPS.length - 1}
                                onStartLearning={openModal}
                            />
                        ))}
                    </div>
                </section>
            </div>

            {/* Modal */}
            <CourseRecommendationModal
                isOpen={isModalOpen}
                currentStep={currentStep}
                selectedLangId={selectedLangId}
                selectedFrameworkId={selectedFrameworkId}
                selectedCourseIds={selectedCourseIds}
                onClose={closeModal}
                onSetLanguage={setLanguage}
                onSetFramework={setFramework}
                onToggleCourse={toggleCourse}
                onNext={goNextStep}
                onPrev={goPrevStep}
                onAccept={handleAccept}
            />
        </main>
    );
};

export default RoadmapPage;
