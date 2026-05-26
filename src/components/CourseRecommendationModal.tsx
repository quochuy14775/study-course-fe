import React from 'react';
import {
    X, ChevronRight, ChevronLeft, Check, BookOpen,
    Sparkles, Code2,
} from 'lucide-react';
import type { ModalStep } from '../types/roadmap';
import { COURSES, FRAMEWORKS, LANGUAGES } from "../mockDatas/mockRoadMap";

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

interface StepperProps {
    steps: { key: ModalStep; label: string }[];
    currentIndex: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentIndex }) => (
    <div className="px-5 py-4 border-b border-ink-200">
        <div className="flex items-center gap-2">
            {steps.map((s, i) => {
                const isDone = i < currentIndex;
                const isActive = i === currentIndex;
                return (
                    <React.Fragment key={s.key}>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div
                                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                    isDone
                                        ? 'bg-gradient-to-br from-code-500 to-code-600 text-white shadow-[0_0_12px_rgb(16,185,129,0.4)]'
                                        : isActive
                                            ? 'bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow-primary scale-110'
                                            : 'bg-ink-100 text-ink-400 border border-ink-200'
                                }`}
                            >
                                {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
                            </div>
                            <span
                                className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
                                    isActive ? 'text-primary-700' : isDone ? 'text-code-600' : 'text-ink-400'
                                }`}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="flex-1 h-0.5 mt-[-14px] rounded-full overflow-hidden bg-ink-200">
                                <div
                                    className={`h-full bg-gradient-to-r from-primary-500 to-accent-600 transition-all duration-500 ${
                                        i < currentIndex ? 'w-full' : 'w-0'
                                    }`}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Difficulty badge
// ---------------------------------------------------------------------------

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    Beginner:     { bg: 'bg-code-50',   text: 'text-code-700',   dot: 'bg-code-500' },
    Intermediate: { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
    Advanced:     { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
};

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
    const s = LEVEL_STYLES[level] ?? { bg: 'bg-ink-100', text: 'text-ink-600', dot: 'bg-ink-400' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${s.bg} ${s.text}`}>
            <span className={`w-1 h-1 rounded-full ${s.dot}`} />
            {level}
        </span>
    );
};

// ---------------------------------------------------------------------------
// Step section header
// ---------------------------------------------------------------------------

const SectionHead: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h3 className="text-base font-bold text-ink-900">{title}</h3>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
    </div>
);

// ---------------------------------------------------------------------------
// Step panels
// ---------------------------------------------------------------------------

interface LanguageStepProps {
    selectedLangId: string | null;
    onSelect: (id: string) => void;
}

const LanguageStep: React.FC<LanguageStepProps> = ({ selectedLangId, onSelect }) => (
    <div className="animate-fade-in">
        <SectionHead title="Chọn ngôn ngữ lập trình" subtitle="Ngôn ngữ bạn muốn tập trung học" />
        <div className="grid grid-cols-3 gap-2.5">
            {LANGUAGES.map((lang) => {
                const selected = selectedLangId === lang.id;
                return (
                    <button
                        key={lang.id}
                        onClick={() => onSelect(lang.id)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                            selected
                                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 text-primary-700 shadow-glow-primary scale-[1.02]'
                                : 'border-ink-200 bg-white text-ink-700 hover:border-primary-300 hover:bg-primary-50/30 hover:scale-[1.02]'
                        }`}
                    >
                        {selected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center">
                                <Check size={10} className="text-white" strokeWidth={3} />
                            </div>
                        )}
                        <i className={`ti ${lang.icon} text-2xl ${selected ? 'text-primary-600' : 'text-ink-600'}`} aria-hidden="true" />
                        {lang.label}
                    </button>
                );
            })}
        </div>
    </div>
);

// ---------------------------------------------------------------------------

interface FrameworkStepProps {
    langId: string;
    selectedFrameworkId: string | null;
    onSelect: (id: string) => void;
}

const FrameworkStep: React.FC<FrameworkStepProps> = ({ langId, selectedFrameworkId, onSelect }) => {
    const frameworks = FRAMEWORKS[langId] ?? [];
    const langLabel = LANGUAGES.find((l) => l.id === langId)?.label ?? langId;

    return (
        <div className="animate-fade-in">
            <SectionHead
                title="Chọn framework"
                subtitle={`Framework phù hợp với ${langLabel}`}
            />
            <div className="grid grid-cols-2 gap-2.5">
                {frameworks.map((fw) => {
                    const selected = selectedFrameworkId === fw.id;
                    return (
                        <button
                            key={fw.id}
                            onClick={() => onSelect(fw.id)}
                            className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 text-left ${
                                selected
                                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 text-primary-700 shadow-glow-primary'
                                    : 'border-ink-200 bg-white text-ink-700 hover:border-primary-300 hover:bg-primary-50/30'
                            }`}
                        >
                            {selected && (
                                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center">
                                    <Check size={10} className="text-white" strokeWidth={3} />
                                </div>
                            )}
                            <i className={`ti ${fw.icon} text-xl flex-shrink-0 ${selected ? 'text-primary-600' : 'text-ink-600'}`} aria-hidden="true" />
                            <span>{fw.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------

interface CoursesStepProps {
    langId: string;
    frameworkId: string;
    selectedCourseIds: Set<string>;
    onToggle: (id: string) => void;
}

const CoursesStep: React.FC<CoursesStepProps> = ({ langId, frameworkId, selectedCourseIds, onToggle }) => {
    const courses = COURSES.filter((c) => c.langId === langId && c.frameworkId === frameworkId);
    const langLabel = LANGUAGES.find((l) => l.id === langId)?.label ?? langId;
    const fwLabel = (FRAMEWORKS[langId] ?? []).find((f) => f.id === frameworkId)?.label ?? frameworkId;

    if (!courses.length) {
        return (
            <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-ink-100 mx-auto mb-3 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-ink-400" />
                </div>
                <p className="text-sm text-ink-500 font-medium">Chưa có khóa học cho lựa chọn này</p>
                <p className="text-xs text-ink-400 mt-1">Vui lòng quay lại chọn framework khác</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <SectionHead
                title="Khóa học gợi ý"
                subtitle={`${langLabel} · ${fwLabel} — Chọn ít nhất 1 khóa học`}
            />
            <div className="space-y-2">
                {courses.map((course) => {
                    const selected = selectedCourseIds.has(course.id);
                    return (
                        <div
                            key={course.id}
                            role="checkbox"
                            aria-checked={selected}
                            tabIndex={0}
                            onClick={() => onToggle(course.id)}
                            onKeyDown={(e) => e.key === 'Enter' && onToggle(course.id)}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                selected
                                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50'
                                    : 'border-ink-200 hover:border-primary-300 hover:bg-primary-50/30'
                            }`}
                        >
                            <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                                selected
                                    ? 'bg-gradient-to-br from-primary-600 to-accent-600 shadow-glow-primary'
                                    : 'border-2 border-ink-300'
                            }`}>
                                {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className={`text-sm font-semibold ${selected ? 'text-primary-700' : 'text-ink-800'}`}>
                                        {course.title}
                                    </span>
                                    <DifficultyBadge level={course.level} />
                                </div>
                                <p className="text-xs text-ink-500 leading-relaxed">{course.description}</p>
                                <p className="text-[11px] text-ink-400 mt-1.5 font-mono">⏱ {course.duration}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------

interface ReviewStepProps {
    langId: string;
    frameworkId: string;
    selectedCourseIds: Set<string>;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ langId, frameworkId, selectedCourseIds }) => {
    const langLabel = LANGUAGES.find((l) => l.id === langId)?.label ?? langId;
    const fwLabel = (FRAMEWORKS[langId] ?? []).find((f) => f.id === frameworkId)?.label ?? frameworkId;
    const courses = COURSES.filter((c) => selectedCourseIds.has(c.id));

    return (
        <div className="animate-fade-in">
            {/* Summary card */}
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} />
                        <span className="text-xs font-semibold uppercase tracking-wide">Lộ trình của bạn</span>
                    </div>
                    <p className="text-xl font-extrabold font-mono">
                        {langLabel} <span className="text-white/60">·</span> {fwLabel}
                    </p>
                    <p className="text-sm text-white/80 mt-1">{courses.length} khóa học sẽ được thêm vào lộ trình</p>
                </div>
            </div>

            <SectionHead title="Các khóa học đã chọn" />
            <div className="space-y-2">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-ink-200 bg-white"
                    >
                        <div className="w-8 h-8 rounded-lg bg-code-50 flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-code-600" strokeWidth={3} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink-800 truncate">{course.title}</p>
                            <p className="text-xs text-ink-500 font-mono">{course.level} · {course.duration}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

const STEPS: { key: ModalStep; label: string }[] = [
    { key: 'language',  label: 'Ngôn ngữ' },
    { key: 'framework', label: 'Framework' },
    { key: 'courses',   label: 'Khóa học' },
    { key: 'review',    label: 'Xác nhận' },
];

interface CourseRecommendationModalProps {
    isOpen: boolean;
    currentStep: ModalStep;
    selectedLangId: string | null;
    selectedFrameworkId: string | null;
    selectedCourseIds: Set<string>;
    onClose: () => void;
    onSetLanguage: (id: string) => void;
    onSetFramework: (id: string) => void;
    onToggleCourse: (id: string) => void;
    onNext: () => void;
    onPrev: () => void;
    onAccept: () => void;
}

const CourseRecommendationModal: React.FC<CourseRecommendationModalProps> = ({
    isOpen,
    currentStep,
    selectedLangId,
    selectedFrameworkId,
    selectedCourseIds,
    onClose,
    onSetLanguage,
    onSetFramework,
    onToggleCourse,
    onNext,
    onPrev,
    onAccept,
}) => {
    if (!isOpen) return null;

    const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

    const canGoNext = (): boolean => {
        if (currentStep === 'language')  return selectedLangId !== null;
        if (currentStep === 'framework') return selectedFrameworkId !== null;
        if (currentStep === 'courses')   return selectedCourseIds.size > 0;
        return false;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-3xl shadow-soft-lg w-full max-w-xl flex flex-col max-h-[90vh] border border-ink-200 animate-fade-in-up overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 bg-gradient-to-br from-primary-50/50 to-accent-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-glow-primary">
                            <Code2 size={18} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-ink-900">Tạo lộ trình</h2>
                            <p className="text-xs text-ink-500 font-mono">step {stepIndex + 1}/{STEPS.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
                        aria-label="Đóng modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Stepper */}
                <Stepper steps={STEPS} currentIndex={stepIndex} />

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {currentStep === 'language' && (
                        <LanguageStep selectedLangId={selectedLangId} onSelect={onSetLanguage} />
                    )}
                    {currentStep === 'framework' && selectedLangId && (
                        <FrameworkStep langId={selectedLangId} selectedFrameworkId={selectedFrameworkId} onSelect={onSetFramework} />
                    )}
                    {currentStep === 'courses' && selectedLangId && selectedFrameworkId && (
                        <CoursesStep
                            langId={selectedLangId}
                            frameworkId={selectedFrameworkId}
                            selectedCourseIds={selectedCourseIds}
                            onToggle={onToggleCourse}
                        />
                    )}
                    {currentStep === 'review' && selectedLangId && selectedFrameworkId && (
                        <ReviewStep
                            langId={selectedLangId}
                            frameworkId={selectedFrameworkId}
                            selectedCourseIds={selectedCourseIds}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-ink-200 bg-ink-50/50">
                    <button
                        onClick={onPrev}
                        disabled={stepIndex === 0}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={16} /> Quay lại
                    </button>

                    {currentStep !== 'review' ? (
                        <button
                            onClick={onNext}
                            disabled={!canGoNext()}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-semibold rounded-xl hover:shadow-glow-primary active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                        >
                            {currentStep === 'courses'
                                ? `Xem lại (${selectedCourseIds.size})`
                                : 'Tiếp theo'}
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={onAccept}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-code-500 to-code-600 text-white text-sm font-semibold rounded-xl hover:shadow-[0_0_20px_rgb(16,185,129,0.4)] active:scale-95 transition-all"
                        >
                            <Check size={16} strokeWidth={3} /> Xác nhận lộ trình
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseRecommendationModal;
