import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { showToast } from '../../../../components/CustomToast';
import quizService from '../../../../services/quizService';
import type { QuizRequest } from '../../../../types/quiz';

/** Local draft shape — mirrors QuizRequest but keeps a client key so rows stay stable while editing. */
interface OptionDraft {
    key: string;
    content: string;
    isCorrect: boolean;
}

interface QuestionDraft {
    key: string;
    content: string;
    points: number;
    options: OptionDraft[];
}

const newKey = () => Math.random().toString(36).slice(2, 10);

const emptyQuestion = (): QuestionDraft => ({
    key: newKey(),
    content: '',
    points: 1,
    options: [
        { key: newKey(), content: '', isCorrect: true },
        { key: newKey(), content: '', isCorrect: false },
    ],
});

interface Props {
    open: boolean;
    onClose: () => void;
    /** Lesson quiz khi có lessonId, course test khi không. */
    lessonId?: number;
    courseId: number;
    defaultTitle: string;
}

const QuizFormDialog: React.FC<Props> = ({ open, onClose, lessonId, courseId, defaultTitle }) => {
    const isLessonQuiz = lessonId !== undefined;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exists, setExists] = useState(false);
    const [title, setTitle] = useState(defaultTitle);
    const [passPercentage, setPassPercentage] = useState(70);
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(isLessonQuiz ? 5 : 45);
    const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);

    useEffect(() => {
        if (!open) return;
        let mounted = true;
        setLoading(true);

        const fetch = isLessonQuiz
            ? quizService.getLessonQuizAdmin(lessonId!)
            : quizService.getCourseTestAdmin(courseId);

        fetch
            .then((q) => {
                if (!mounted) return;
                setExists(true);
                setTitle(q.title);
                setPassPercentage(q.passPercentage);
                setTimeLimitMinutes(q.timeLimitMinutes);
                setQuestions(q.questions.map((qq) => ({
                    key: newKey(),
                    content: qq.content,
                    points: qq.points,
                    options: qq.options.map((o) => ({
                        key: newKey(),
                        content: o.content,
                        isCorrect: o.isCorrect,
                    })),
                })));
            })
            .catch(() => {
                // 404 = chưa có quiz cho scope này → giữ nguyên form trống
                if (mounted) setExists(false);
            })
            .finally(() => { if (mounted) setLoading(false); });

        return () => { mounted = false; };
    }, [open, lessonId, courseId, isLessonQuiz]);

    const updateQuestion = (key: string, patch: Partial<QuestionDraft>) =>
        setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)));

    const updateOption = (qKey: string, oKey: string, patch: Partial<OptionDraft>) =>
        setQuestions((prev) => prev.map((q) => q.key === qKey
            ? { ...q, options: q.options.map((o) => (o.key === oKey ? { ...o, ...patch } : o)) }
            : q));

    /** Chỉ 1 đáp án đúng mỗi câu — BE cũng validate đúng ràng buộc này. */
    const setCorrectOption = (qKey: string, oKey: string) =>
        setQuestions((prev) => prev.map((q) => q.key === qKey
            ? { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.key === oKey })) }
            : q));

    const addOption = (qKey: string) =>
        setQuestions((prev) => prev.map((q) => q.key === qKey
            ? { ...q, options: [...q.options, { key: newKey(), content: '', isCorrect: false }] }
            : q));

    const removeOption = (qKey: string, oKey: string) =>
        setQuestions((prev) => prev.map((q) => {
            if (q.key !== qKey || q.options.length <= 2) return q;
            const remaining = q.options.filter((o) => o.key !== oKey);
            // Nếu xóa mất đáp án đúng thì gán lại cho lựa chọn đầu tiên
            if (!remaining.some((o) => o.isCorrect)) remaining[0].isCorrect = true;
            return { ...q, options: remaining };
        }));

    const validate = (): string | null => {
        if (!title.trim()) return 'Vui lòng nhập tiêu đề.';
        if (passPercentage < 1 || passPercentage > 100) return 'Điểm đạt phải từ 1 đến 100.';
        if (questions.length === 0) return 'Cần ít nhất 1 câu hỏi.';
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.content.trim()) return `Câu ${i + 1}: chưa nhập nội dung câu hỏi.`;
            if (q.options.length < 2) return `Câu ${i + 1}: cần ít nhất 2 lựa chọn.`;
            if (q.options.some((o) => !o.content.trim())) return `Câu ${i + 1}: có lựa chọn còn trống.`;
            if (q.options.filter((o) => o.isCorrect).length !== 1) return `Câu ${i + 1}: phải chọn đúng 1 đáp án đúng.`;
        }
        return null;
    };

    const handleSave = async () => {
        const error = validate();
        if (error) { showToast.error(error); return; }

        const payload: QuizRequest = {
            title: title.trim(),
            passPercentage,
            timeLimitMinutes,
            questions: questions.map((q, qi) => ({
                content: q.content.trim(),
                orderIndex: qi + 1,
                points: q.points,
                options: q.options.map((o, oi) => ({
                    content: o.content.trim(),
                    isCorrect: o.isCorrect,
                    orderIndex: oi + 1,
                })),
            })),
        };

        setSaving(true);
        try {
            if (isLessonQuiz) await quizService.saveLessonQuiz(lessonId!, payload);
            else await quizService.saveCourseTest(courseId, payload);
            showToast.success(isLessonQuiz ? 'Đã lưu quiz cuối bài' : 'Đã lưu bài test cuối khóa');
            onClose();
        } catch (err) {
            console.error(err);
            showToast.error('Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Xóa toàn bộ quiz này?')) return;
        setSaving(true);
        try {
            if (isLessonQuiz) await quizService.deleteLessonQuiz(lessonId!);
            else await quizService.deleteCourseTest(courseId);
            showToast.success('Đã xóa quiz');
            onClose();
        } catch (err) {
            console.error(err);
            showToast.error('Xóa thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-soft-lg flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <HelpCircle size={18} className="text-primary-600" />
                        <h2 className="text-lg font-bold text-ink-900">
                            {isLessonQuiz ? 'Quiz cuối bài' : 'Bài test cuối khóa'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-ink-500">Đang tải...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Meta */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Tiêu đề</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Điểm đạt (%)</label>
                                    <input
                                        type="number" min={1} max={100}
                                        value={passPercentage}
                                        onChange={(e) => setPassPercentage(Number(e.target.value))}
                                        className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Thời gian (phút)</label>
                                    <input
                                        type="number" min={1} max={300}
                                        value={timeLimitMinutes}
                                        onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                                        className="w-full bg-white border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-3">
                                {questions.map((q, qi) => (
                                    <div key={q.key} className="border border-ink-200 rounded-2xl p-4 bg-ink-50/40">
                                        <div className="flex items-start gap-2 mb-3">
                                            <span className="text-xs font-mono font-bold text-ink-400 mt-2.5 w-6 flex-shrink-0">
                                                {String(qi + 1).padStart(2, '0')}
                                            </span>
                                            <textarea
                                                value={q.content}
                                                onChange={(e) => updateQuestion(q.key, { content: e.target.value })}
                                                placeholder="Nhập nội dung câu hỏi..."
                                                rows={2}
                                                className="flex-1 resize-none bg-white border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                                            />
                                            {questions.length > 1 && (
                                                <button
                                                    onClick={() => setQuestions((prev) => prev.filter((x) => x.key !== q.key))}
                                                    className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                                                    title="Xóa câu hỏi"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2 pl-8">
                                            {q.options.map((o) => (
                                                <div key={o.key} className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setCorrectOption(q.key, o.key)}
                                                        title="Đánh dấu là đáp án đúng"
                                                        className={`p-1 rounded-full transition-colors flex-shrink-0 ${
                                                            o.isCorrect ? 'text-code-600' : 'text-ink-300 hover:text-code-500'
                                                        }`}
                                                    >
                                                        <CheckCircle2 size={18} className={o.isCorrect ? 'fill-code-100' : ''} />
                                                    </button>
                                                    <input
                                                        value={o.content}
                                                        onChange={(e) => updateOption(q.key, o.key, { content: e.target.value })}
                                                        placeholder="Nội dung lựa chọn..."
                                                        className={`flex-1 bg-white border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                                                            o.isCorrect
                                                                ? 'border-code-300 text-code-800 focus:ring-code-200'
                                                                : 'border-ink-200 text-ink-900 focus:ring-primary-300 focus:border-primary-400'
                                                        }`}
                                                    />
                                                    {q.options.length > 2 && (
                                                        <button
                                                            onClick={() => removeOption(q.key, o.key)}
                                                            className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addOption(q.key)}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors ml-7"
                                            >
                                                <Plus size={13} /> Thêm lựa chọn
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ink-300 text-ink-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl font-semibold text-sm transition-all"
                            >
                                <Plus size={16} /> Thêm câu hỏi
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-ink-200 flex-shrink-0">
                            <div>
                                {exists && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition-colors"
                                    >
                                        <Trash2 size={14} /> Xóa quiz
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {saving ? 'Đang lưu...' : 'Lưu quiz'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuizFormDialog;
