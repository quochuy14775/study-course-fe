import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Sparkles, Wand2, ArrowLeft, ArrowRight, Check, Search,
    BookOpen, Clock, Layers, Code2, ChevronRight, X,
} from 'lucide-react';
import { showToast } from '../components/CustomToast';
import languageService from '../services/languageService';
import frameworkService from '../services/frameworkService';
import courseService from '../services/courseServices';
import roadmapService from '../services/roadmapService';
import type { Roadmap } from '../types/roadmap';
import type { Language } from '../types/language';
import type { Framework } from '../types/framework';
import type { Course } from '../types/course';

// ---------------------------------------------------------------------------
// Local view models (normalize BE data to UI shape)
// ---------------------------------------------------------------------------

interface LangOpt { id: number; name: string; slug: string; icon: string | null }
interface FrameworkOpt { id: number; name: string; slug: string; icon: string | null; languageIds: number[] }
interface CourseOpt {
    id: number; title: string; description: string;
    imageUrl?: string | null;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    durationSeconds: number;
    languageIds: number[];
    frameworkIds: number[];
    langTags: { name: string; icon: string | null }[];
    fwTags:  { name: string; icon: string | null }[];
}

const toLangOpt = (l: Language): LangOpt => ({
    id: l.id, name: l.name, slug: l.slug, icon: l.iconUrl ?? null,
});

const toFwOpt = (f: Framework): FrameworkOpt => ({
    id: f.id, name: f.name, slug: f.slug, icon: f.iconUrl ?? null,
    languageIds: (f.languages ?? []).map((l) => l.id),
});

const toCourseOpt = (c: Course): CourseOpt => ({
    id: c.id, title: c.title, description: c.description,
    imageUrl: c.imageUrl ?? null,
    level: (c.level as CourseOpt['level']) ?? 'Beginner',
    durationSeconds: c.totalDurationSeconds ?? 0,
    languageIds: (c.languages ?? []).map((l) => l.id),
    frameworkIds: (c.frameworks ?? []).map((f) => f.id),
    langTags: (c.languages ?? []).map((l) => ({ name: l.name, icon: l.iconUrl ?? null })),
    fwTags:  (c.frameworks ?? []).map((f) => ({ name: f.name, icon: f.iconUrl ?? null })),
});

const fmtDuration = (s: number) => {
    if (!s) return '0m';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ---------------------------------------------------------------------------
// Step types
// ---------------------------------------------------------------------------

type Mode = 'ai' | 'manual';
type Step = 'mode' | 'ai-prompt' | 'languages' | 'frameworks' | 'courses' | 'review';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RoadmapCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called with the saved Roadmap after successful creation */
    onCreated?: (roadmap: Roadmap) => void;
}

const RoadmapCreator: React.FC<RoadmapCreatorProps> = ({ isOpen, onClose, onCreated }) => {
    const [step, setStep] = useState<Step>('mode');
    const [mode, setMode] = useState<Mode | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [selectedLangIds, setSelectedLangIds] = useState<number[]>([]);
    const [selectedFwIds, setSelectedFwIds] = useState<number[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Server data
    const [languages, setLanguages] = useState<LangOpt[]>([]);
    const [frameworks, setFrameworks] = useState<FrameworkOpt[]>([]);
    const [courses, setCourses] = useState<CourseOpt[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Reset whenever modal opens fresh
    useEffect(() => {
        if (!isOpen) return;
        setStep('mode'); setMode(null); setAiPrompt('');
        setSelectedLangIds([]); setSelectedFwIds([]); setSelectedCourseIds([]); setSearch('');
    }, [isOpen]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    // ESC to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Load languages + frameworks once user enters manual flow
    useEffect(() => {
        if (!isOpen || mode !== 'manual' || languages.length > 0) return;
        setLoadingMeta(true);
        Promise.all([languageService.getLanguages(), frameworkService.getFrameworks()])
            .then(([ls, fs]) => {
                setLanguages(ls.map(toLangOpt));
                setFrameworks(fs.map(toFwOpt));
            })
            .catch(() => showToast.error('Không tải được dữ liệu ngôn ngữ/framework'))
            .finally(() => setLoadingMeta(false));
    }, [isOpen, mode, languages.length]);

    // Load courses when reaching the courses step
    useEffect(() => {
        if (!isOpen || step !== 'courses' || courses.length > 0) return;
        setLoadingCourses(true);
        courseService.getCourses({ count: true, top: 100 })
            .then((res) => setCourses((res.value ?? []).map(toCourseOpt)))
            .catch(() => showToast.error('Không tải được danh sách khóa học'))
            .finally(() => setLoadingCourses(false));
    }, [isOpen, step, courses.length]);

    // Filtered frameworks: only ones that belong to selected languages
    const availableFrameworks = useMemo(
        () => frameworks.filter((f) => f.languageIds.some((id) => selectedLangIds.includes(id))),
        [frameworks, selectedLangIds],
    );

    // Filtered courses:
    //   - Ưu tiên courses có association với lang/fw đã chọn
    //   - Fallback: courses chưa có association (languages/frameworks = []) cũng hiện
    //   - Courses thuộc lang/fw KHÁC thì ẩn
    const availableCourses = useMemo(() => {
        const list = courses.filter((c) => {
            const hasNoAssoc = c.languageIds.length === 0 && c.frameworkIds.length === 0;
            if (hasNoAssoc) return true; // chưa gán → show all
            const langMatch = c.languageIds.some((id) => selectedLangIds.includes(id));
            const fwMatch = c.frameworkIds.some((id) => selectedFwIds.includes(id));
            return langMatch || fwMatch;
        });
        const q = search.trim().toLowerCase();
        return q ? list.filter((c) => c.title.toLowerCase().includes(q)) : list;
    }, [courses, selectedLangIds, selectedFwIds, search]);

    // Auto-clean framework selection when a parent lang is removed
    useEffect(() => {
        setSelectedFwIds((prev) =>
            prev.filter((fwId) => {
                const fw = frameworks.find((f) => f.id === fwId);
                return fw?.languageIds.some((id) => selectedLangIds.includes(id));
            }),
        );
    }, [selectedLangIds, frameworks]);

    const toggleLang = (id: number) =>
        setSelectedLangIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const toggleFw = (id: number) =>
        setSelectedFwIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const toggleCourse = (id: number) =>
        setSelectedCourseIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const stepOrder: Step[] = mode === 'ai' ? ['mode', 'ai-prompt', 'review'] : ['mode', 'languages', 'frameworks', 'courses', 'review'];
    const stepIdx = stepOrder.indexOf(step);

    const canNext = (): boolean => {
        if (step === 'mode') return mode !== null;
        if (step === 'ai-prompt') return aiPrompt.trim().length > 5;
        if (step === 'languages') return selectedLangIds.length > 0;
        if (step === 'frameworks') return true; // optional
        if (step === 'courses') return selectedCourseIds.length > 0;
        return false;
    };

    const next = () => {
        const nextStep = stepOrder[stepIdx + 1];
        if (nextStep) setStep(nextStep);
    };
    const prev = () => {
        const prevStep = stepOrder[stepIdx - 1];
        if (prevStep) setStep(prevStep);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const selectedCourses = courses.filter((c) => selectedCourseIds.includes(c.id));
            const title = [
                languages.filter((l) => selectedLangIds.includes(l.id)).map((l) => l.name).join(', '),
                frameworks.filter((f) => selectedFwIds.includes(f.id)).map((f) => f.name).join(', '),
            ].filter(Boolean).join(' · ') || 'Lộ trình học tập';

            const roadmap = await roadmapService.createRoadmap({
                title,
                isActive: true,
                courseIds: selectedCourses.map((c) => c.id),
            });

            showToast.success('Đã tạo lộ trình thành công');
            onCreated?.(roadmap);
            onClose();
        } catch {
            showToast.error('Tạo lộ trình thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header (sticky) */}
                        <div className="flex-shrink-0 px-6 sm:px-8 py-5 border-b border-ink-100 bg-gradient-to-br from-white via-white to-primary-50/30">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-1">
                                        <Sparkles size={11} />
                                        <span>roadmap / create</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-ink-900 truncate">
                                        Tạo lộ trình học tập
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex-shrink-0 p-2 rounded-xl text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
                                    aria-label="Đóng"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Progress bar */}
                            {step !== 'mode' && (
                                <div className="mt-4 flex items-center gap-1.5">
                                    {stepOrder.slice(1).map((s, i) => {
                                        const idx = i + 1;
                                        const active = idx <= stepIdx;
                                        return (
                                            <div
                                                key={s}
                                                className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                                                    active ? 'bg-gradient-to-r from-primary-500 to-accent-500' : 'bg-ink-200'
                                                }`}
                                            />
                                        );
                                    })}
                                    <span className="text-[10px] font-mono text-ink-500 ml-2">
                                        {stepIdx}/{stepOrder.length - 1}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Body (scrollable) */}
                        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    {step === 'mode' && <ModeStep mode={mode} onPick={setMode} />}
                                    {step === 'ai-prompt' && <AiPromptStep value={aiPrompt} onChange={setAiPrompt} />}
                                    {step === 'languages' && (
                                        <LanguagesStep
                                            languages={languages}
                                            selected={selectedLangIds}
                                            onToggle={toggleLang}
                                            loading={loadingMeta}
                                        />
                                    )}
                                    {step === 'frameworks' && (
                                        <FrameworksStep
                                            frameworks={availableFrameworks}
                                            languages={languages}
                                            selectedLangIds={selectedLangIds}
                                            selected={selectedFwIds}
                                            onToggle={toggleFw}
                                        />
                                    )}
                                    {step === 'courses' && (
                                        <CoursesStep
                                            courses={availableCourses}
                                            selected={selectedCourseIds}
                                            onToggle={toggleCourse}
                                            search={search}
                                            onSearch={setSearch}
                                            loading={loadingCourses}
                                        />
                                    )}
                                    {step === 'review' && (
                                        <ReviewStep
                                            mode={mode!}
                                            aiPrompt={aiPrompt}
                                            langs={languages.filter((l) => selectedLangIds.includes(l.id))}
                                            frameworks={frameworks.filter((f) => selectedFwIds.includes(f.id))}
                                            courses={courses.filter((c) => selectedCourseIds.includes(c.id))}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer (sticky) */}
                        <div className="flex-shrink-0 px-6 sm:px-8 py-4 border-t border-ink-100 bg-white flex items-center justify-between gap-3">
                            <button
                                onClick={step === 'mode' ? onClose : prev}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink-500 hover:text-ink-900 hover:bg-ink-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={15} />
                                {step === 'mode' ? 'Hủy' : 'Quay lại'}
                            </button>

                            {step === 'review' ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all text-sm"
                                >
                                    <Check size={15} />
                                    {submitting ? 'Đang tạo...' : 'Xác nhận tạo lộ trình'}
                                </button>
                            ) : (
                                <button
                                    onClick={next}
                                    disabled={!canNext()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all text-sm"
                                >
                                    Tiếp tục
                                    <ArrowRight size={15} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ---------------------------------------------------------------------------
// Step: Mode selection
// ---------------------------------------------------------------------------

const ModeStep: React.FC<{ mode: Mode | null; onPick: (m: Mode) => void }> = ({ mode, onPick }) => (
    <div>
        <h2 className="text-xl font-bold text-ink-900 mb-1">Bạn muốn tạo lộ trình như thế nào?</h2>
        <p className="text-sm text-ink-500 mb-6">Chọn cách phù hợp với bạn — có thể chuyển đổi bất cứ lúc nào</p>

        <div className="grid sm:grid-cols-2 gap-4">
            <button
                onClick={() => onPick('ai')}
                className={`group relative text-left p-6 rounded-2xl border-2 transition-all ${
                    mode === 'ai'
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 shadow-glow-primary'
                        : 'border-ink-200 bg-white hover:border-primary-300 hover:shadow-soft'
                }`}
            >
                {mode === 'ai' && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles size={22} />
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-1">Tạo bằng AI</h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                    Mô tả mục tiêu — AI gợi ý ngôn ngữ, framework và khóa học phù hợp
                </p>
                <div className="flex items-center gap-1.5 mt-4 text-xs font-mono text-primary-600">
                    <span>Khuyến nghị</span>
                    <ChevronRight size={12} />
                </div>
            </button>

            <button
                onClick={() => onPick('manual')}
                className={`group relative text-left p-6 rounded-2xl border-2 transition-all ${
                    mode === 'manual'
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 shadow-glow-primary'
                        : 'border-ink-200 bg-white hover:border-primary-300 hover:shadow-soft'
                }`}
            >
                {mode === 'manual' && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                    </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ink-700 to-ink-900 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                    <Wand2 size={22} />
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-1">Tạo thủ công</h3>
                <p className="text-sm text-ink-500 leading-relaxed">
                    Tự chọn ngôn ngữ, framework, và các khóa học bạn muốn học
                </p>
                <div className="flex items-center gap-1.5 mt-4 text-xs font-mono text-ink-600">
                    <span>Kiểm soát hoàn toàn</span>
                    <ChevronRight size={12} />
                </div>
            </button>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Step: AI prompt
// ---------------------------------------------------------------------------

const AiPromptStep: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
    <div>
        <h2 className="text-xl font-bold text-ink-900 mb-1">Mô tả mục tiêu của bạn</h2>
        <p className="text-sm text-ink-500 mb-6">AI sẽ phân tích và đề xuất lộ trình phù hợp</p>

        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="VD: Tôi muốn trở thành Backend developer sử dụng Node.js và PostgreSQL, hiện đã biết JavaScript cơ bản..."
            rows={6}
            className="w-full p-4 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all resize-none"
        />

        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary-50/60 to-accent-50/60 border border-primary-200">
            <div className="flex items-start gap-2.5">
                <Sparkles size={16} className="text-primary-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-ink-700 leading-relaxed">
                    <p className="font-semibold mb-1">Gợi ý để có kết quả tốt:</p>
                    <ul className="space-y-0.5 text-ink-600">
                        <li>• Nêu mục tiêu cụ thể (Frontend, Backend, DevOps...)</li>
                        <li>• Cho biết trình độ hiện tại</li>
                        <li>• Thời gian bạn có thể dành mỗi tuần</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Step: Languages (multi-select)
// ---------------------------------------------------------------------------

const IconBadge: React.FC<{ icon: string | null; name: string; size?: 'sm' | 'lg' }> = ({ icon, name, size = 'lg' }) => {
    const cls = size === 'lg' ? 'w-10 h-10 text-xl' : 'w-7 h-7 text-base';
    if (icon) {
        return <img src={icon} alt={name} className={`${cls} object-contain rounded-lg`} />;
    }
    return (
        <div className={`${cls} rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center font-bold text-primary-700`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
};

const LoadingGrid: React.FC = () => (
    <div className="py-12 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
    </div>
);

const LanguagesStep: React.FC<{
    languages: LangOpt[]; selected: number[]; onToggle: (id: number) => void; loading?: boolean;
}> = ({ languages, selected, onToggle, loading }) => {
    const [langSearch, setLangSearch] = React.useState('');

    const filtered = langSearch.trim()
        ? languages.filter((l) => l.name.toLowerCase().includes(langSearch.toLowerCase()))
        : languages;

    const selectedLangs = languages.filter((l) => selected.includes(l.id));

    return (
        <div className="flex flex-col gap-6">

            {/* ── Header ── */}
            <div>
                <h2 className="text-lg font-extrabold text-ink-900 tracking-tight">Ngôn ngữ lập trình</h2>
                <p className="text-xs text-ink-400 mt-0.5">Nhấn để chọn — có thể chọn nhiều</p>
            </div>

            {/* ── Search ── */}
            <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Tìm ngôn ngữ..."
                    className="w-full pl-10 pr-9 py-2.5 bg-ink-50 border border-ink-200 rounded-full text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
                />
                {langSearch && (
                    <button onClick={() => setLangSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* ── Flowing Chips ── */}
            {loading ? (
                <LoadingGrid />
            ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-sm font-semibold text-ink-500">Không tìm thấy ngôn ngữ</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2.5">
                    {filtered.map((lang) => {
                        const isOn = selected.includes(lang.id);
                        return (
                            <button
                                key={lang.id}
                                onClick={() => onToggle(lang.id)}
                                className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 select-none ${
                                    isOn
                                        ? 'bg-primary-50 border-primary-400 text-primary-700 shadow-sm scale-[1.03]'
                                        : 'bg-white border-ink-200 text-ink-600 hover:border-primary-200 hover:bg-primary-50/40 hover:text-ink-900 hover:scale-[1.02]'
                                }`}
                            >
                                {/* Icon — không can thiệp */}
                                {lang.icon
                                    ? <img src={lang.icon} alt={lang.name} className="w-5 h-5 object-contain" />
                                    : <span className={`w-5 h-5 rounded-md text-xs font-extrabold flex items-center justify-center ${isOn ? 'bg-primary-200 text-primary-700' : 'bg-ink-100 text-ink-600'}`}>{lang.name.charAt(0)}</span>
                                }

                                {lang.name}

                                {/* Check — chỉ hiện khi selected */}
                                <span className={`transition-all duration-200 ${isOn ? 'opacity-100 scale-100' : 'opacity-0 scale-0 w-0 overflow-hidden'}`}>
                                    <Check size={13} strokeWidth={3} className="text-white/80" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Summary bar ── */}
            {selectedLangs.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary-50 border border-primary-200">
                    <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                            {selectedLangs.length}
                        </span>
                        <span className="text-sm font-medium text-primary-700">
                            {selectedLangs.map(l => l.name).join(' · ')}
                        </span>
                    </div>
                    <button
                        onClick={() => selectedLangs.forEach(l => onToggle(l.id))}
                        className="text-xs text-primary-400 hover:text-primary-700 transition-colors"
                    >
                        Bỏ hết
                    </button>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Step: Frameworks — grouped by language
// ---------------------------------------------------------------------------

const FrameworksStep: React.FC<{
    frameworks: FrameworkOpt[];
    languages: LangOpt[];
    selectedLangIds: number[];
    selected: number[];
    onToggle: (id: number) => void;
}> = ({ frameworks, languages, selectedLangIds, selected, onToggle }) => {
    const grouped = selectedLangIds.map((langId) => ({
        lang: languages.find((l) => l.id === langId)!,
        items: frameworks.filter((f) => f.languageIds.includes(langId)),
    }));

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-ink-900 mb-1">Chọn framework</h2>
                    <p className="text-sm text-ink-500">Tùy chọn — chọn framework bạn quan tâm theo từng ngôn ngữ</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                    {selected.length} đã chọn
                </span>
            </div>

            {frameworks.length === 0 ? (
                <div className="py-12 text-center">
                    <Layers className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                    <p className="text-sm text-ink-500">Không có framework nào cho ngôn ngữ đã chọn</p>
                    <p className="text-xs text-ink-400 mt-1">Bạn có thể bỏ qua bước này</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {grouped.map(({ lang, items }) => items.length > 0 && (
                        <div key={lang.id}>
                            <div className="flex items-center gap-2 mb-3">
                                <IconBadge icon={lang.icon} name={lang.name} size="sm" />
                                <h3 className="font-bold text-sm text-ink-900">{lang.name}</h3>
                                <span className="text-[10px] font-mono text-ink-400">
                                    {items.filter((i) => selected.includes(i.id)).length}/{items.length}
                                </span>
                                <div className="flex-1 h-px bg-ink-100" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {items.map((fw) => {
                                    const isOn = selected.includes(fw.id);
                                    return (
                                        <button
                                            key={fw.id}
                                            onClick={() => onToggle(fw.id)}
                                            className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                                                isOn
                                                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50'
                                                    : 'border-ink-200 bg-white hover:border-primary-300'
                                            }`}
                                        >
                                            <IconBadge icon={fw.icon} name={fw.name} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-ink-900 truncate">{fw.name}</p>
                                            </div>
                                            {isOn && (
                                                <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Step: Courses
// ---------------------------------------------------------------------------

const LEVEL_COLOR: Record<CourseOpt['level'], string> = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
    Advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CoursesStep: React.FC<{
    courses: CourseOpt[];
    selected: number[];
    onToggle: (id: number) => void;
    search: string;
    onSearch: (v: string) => void;
    loading?: boolean;
}> = ({ courses, selected, onToggle, search, onSearch, loading }) => (
    <div>
        <div className="flex items-start justify-between mb-4">
            <div>
                <h2 className="text-xl font-bold text-ink-900 mb-1">Chọn khóa học</h2>
                <p className="text-sm text-ink-500">Các khóa học phù hợp với lựa chọn của bạn</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                {selected.length} đã chọn
            </span>
        </div>

        <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Tìm khóa học..."
                className="w-full pl-10 pr-3 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
            />
        </div>

        {loading ? <LoadingGrid /> : courses.length === 0 ? (
            <div className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                <p className="text-sm text-ink-500">Không tìm thấy khóa học phù hợp</p>
                <p className="text-xs text-ink-400 mt-1">Thử chọn thêm ngôn ngữ hoặc framework</p>
            </div>
        ) : (
            <div className="space-y-2">
                {courses.map((course) => {
                    const isOn = selected.includes(course.id);
                    return (
                        <button
                            key={course.id}
                            onClick={() => onToggle(course.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all group ${
                                isOn
                                    ? 'border-primary-500 bg-gradient-to-r from-primary-50/70 to-accent-50/50'
                                    : 'border-ink-200 bg-white hover:border-primary-200 hover:bg-ink-50/50'
                            }`}
                        >
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isOn ? 'bg-primary-600 border-primary-600' : 'border-ink-300 group-hover:border-primary-400'
                            }`}>
                                {isOn && <Check size={11} className="text-white" />}
                            </div>

                            {/* Thumbnail */}
                            <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-ink-100 to-ink-200">
                                {course.imageUrl
                                    ? <img src={course.imageUrl} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen size={16} className="text-ink-400" />
                                      </div>
                                }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-ink-900 truncate leading-snug">{course.title}</p>

                                {/* Tags row */}
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${LEVEL_COLOR[course.level]}`}>
                                        {course.level}
                                    </span>
                                    {course.langTags.slice(0, 2).map((t) => (
                                        <span key={t.name} className="inline-flex items-center gap-1 text-[10px] text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded-md">
                                            {t.icon
                                                ? <img src={t.icon} className="w-3 h-3 object-contain" alt="" />
                                                : <span className="w-3 h-3 rounded-sm bg-ink-300 inline-block" />
                                            }
                                            {t.name}
                                        </span>
                                    ))}
                                    {course.fwTags.slice(0, 2).map((t) => (
                                        <span key={t.name} className="inline-flex items-center gap-1 text-[10px] text-ink-500 bg-primary-50 px-1.5 py-0.5 rounded-md">
                                            {t.icon
                                                ? <img src={t.icon} className="w-3 h-3 object-contain" alt="" />
                                                : <span className="w-3 h-3 rounded-sm bg-primary-200 inline-block" />
                                            }
                                            {t.name}
                                        </span>
                                    ))}
                                    {course.durationSeconds > 0 && (
                                        <span className="text-[10px] text-ink-400 flex items-center gap-0.5 ml-auto">
                                            <Clock size={10} /> {fmtDuration(course.durationSeconds)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        )}
    </div>
);

// ---------------------------------------------------------------------------
// Step: Review
// ---------------------------------------------------------------------------

const ReviewStep: React.FC<{
    mode: Mode; aiPrompt: string;
    langs: LangOpt[]; frameworks: FrameworkOpt[]; courses: CourseOpt[];
}> = ({ mode, aiPrompt, langs, frameworks, courses }) => (
    <div>
        <h2 className="text-xl font-bold text-ink-900 mb-1">Xem lại lộ trình</h2>
        <p className="text-sm text-ink-500 mb-6">Kiểm tra trước khi tạo</p>

        {mode === 'ai' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200">
                <div className="flex items-center gap-2 text-xs font-mono text-primary-700 mb-2">
                    <Sparkles size={12} /> AI Prompt
                </div>
                <p className="text-sm text-ink-800 leading-relaxed">{aiPrompt}</p>
            </div>
        ) : (
            <div className="space-y-4">
                <ReviewSection title="Ngôn ngữ" count={langs.length}>
                    <div className="flex flex-wrap gap-2">
                        {langs.map((l) => (
                            <span key={l.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink-200 text-sm">
                                <IconBadge icon={l.icon} name={l.name} size="sm" />
                                <span className="font-semibold">{l.name}</span>
                            </span>
                        ))}
                    </div>
                </ReviewSection>

                {frameworks.length > 0 && (
                    <ReviewSection title="Framework" count={frameworks.length}>
                        <div className="flex flex-wrap gap-2">
                            {frameworks.map((f) => (
                                <span key={f.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink-200 text-sm">
                                    <IconBadge icon={f.icon} name={f.name} size="sm" />
                                    <span className="font-semibold">{f.name}</span>
                                </span>
                            ))}
                        </div>
                    </ReviewSection>
                )}

                <ReviewSection title="Khóa học" count={courses.length}>
                    <div className="space-y-1.5">
                        {courses.map((c) => (
                            <div key={c.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-ink-200">
                                {c.imageUrl
                                    ? <img src={c.imageUrl} className="w-8 h-6 rounded object-cover flex-shrink-0" alt="" />
                                    : <BookOpen size={14} className="text-primary-600 flex-shrink-0" />
                                }
                                <span className="text-sm font-medium text-ink-800 flex-1 truncate">{c.title}</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${LEVEL_COLOR[c.level]}`}>{c.level}</span>
                                <span className="text-xs text-ink-400 font-mono flex-shrink-0">{fmtDuration(c.durationSeconds)}</span>
                            </div>
                        ))}
                    </div>
                </ReviewSection>

                <div className="pt-3 border-t border-ink-100 flex items-center justify-between text-sm">
                    <span className="text-ink-500">Tổng thời lượng dự kiến</span>
                    <span className="font-bold font-mono text-ink-900">
                        {fmtDuration(courses.reduce((s, c) => s + c.durationSeconds, 0))}
                    </span>
                </div>
            </div>
        )}
    </div>
);

const ReviewSection: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => (
    <div>
        <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-ink-900">{title}</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-100 text-ink-600">{count}</span>
        </div>
        {children}
    </div>
);

export default RoadmapCreator;
