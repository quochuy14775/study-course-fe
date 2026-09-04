import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle, Clock, CheckCircle2, XCircle, RotateCcw, ArrowRight, ListChecks,
} from 'lucide-react';
import { toast } from 'react-toastify';
import quizService from '../../../services/quizService';
import type { Quiz, QuizAttemptResult } from '../../../types/quiz';

interface Props {
    quiz: Quiz;
    onPassed?: () => void;
    onFinish?: (result: QuizAttemptResult) => void;
}

const QuizPanel: React.FC<Props> = ({ quiz, onPassed, onFinish }) => {
    const [step, setStep] = useState(0); // câu hỏi hiện tại
    const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> optionId
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizAttemptResult | null>(null);
    const [reviewing, setReviewing] = useState(false);

    const question = quiz.questions[step];
    const isLast = step === quiz.questions.length - 1;
    const selectedOptionId = answers[question?.id];

    const selectOption = (optionId: number) => {
        if (submitting) return;
        setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    };

    const finishQuiz = async () => {
        setSubmitting(true);
        try {
            const attemptResult = await quizService.submitAttempt(quiz.id, {
                answers: quiz.questions.map((q) => ({
                    questionId: q.id,
                    selectedOptionId: answers[q.id] ?? null,
                })),
            });
            setResult(attemptResult);
            if (attemptResult.isPassed) onPassed?.();
            onFinish?.(attemptResult);
        } catch (e) {
            console.error(e);
            toast.error('Không thể nộp bài. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const retake = () => {
        setAnswers({});
        setStep(0);
        setResult(null);
        setReviewing(false);
    };

    // ── Kết quả ──────────────────────────────────────────
    if (result && !reviewing) {
        return (
            <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
                <div className="px-20 py-8 text-center sm:px-8">
                    {result.isPassed ? (
                        <CheckCircle2 className="w-9 h-9 text-code-500 mx-auto" />
                    ) : (
                        <XCircle className="w-9 h-9 text-rose-500 mx-auto" />
                    )}
                    <div className="text-xl font-bold text-ink-900 mt-3">
                        Đạt {result.correctCount}/{result.totalCount} câu — {result.percentageScore}%
                    </div>
                    <p className="text-sm text-ink-500 mt-1.5">
                        {result.isPassed
                            ? `Bạn đã vượt mức yêu cầu ${quiz.passPercentage}%. Bài học tiếp theo đã được mở khóa.`
                            : `Chưa đạt mức yêu cầu ${quiz.passPercentage}%. Hãy xem lại bài học và thử lại.`}
                    </p>
                    <div className="flex items-center justify-center gap-2.5 mt-5">
                        <button
                            onClick={() => setReviewing(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-ink-600 border border-ink-200 hover:bg-ink-50 transition-colors"
                        >
                            <ListChecks className="w-3.5 h-3.5" /> Xem lại đáp án
                        </button>
                        {result.isPassed ? (
                            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-colors">
                                Học bài tiếp theo <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                onClick={retake}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Làm lại
                            </button>
                        )}
                    </div>
                    <div className="text-[11px] text-ink-300 mt-4">
                        Lần làm {result.attemptNumber}
                    </div>
                </div>
            </div>
        );
    }

    // ── Xem lại đáp án ───────────────────────────────────
    if (reviewing && result) {
        return (
            <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
                <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">Xem lại đáp án</span>
                    <span className="text-xs font-bold text-primary-600">{result.percentageScore}%</span>
                </div>
                <div className="p-5 space-y-5 max-h-[520px] overflow-y-auto">
                    {result.answers.map((a, qi) => (
                        <div key={a.questionId}>
                            <p className="text-sm font-medium text-ink-800 mb-2.5">
                                {qi + 1}. {a.questionContent}
                            </p>
                            <div className="space-y-1.5">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium border-code-300 bg-code-50 text-code-700`}>
                                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    {a.correctOptionContent}
                                </div>
                                {!a.isCorrect && a.selectedOptionContent && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium border-rose-300 bg-rose-50 text-rose-700">
                                        <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                        {a.selectedOptionContent}
                                    </div>
                                )}
                                {!a.selectedOptionContent && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium border-ink-200 text-ink-400">
                                        Bạn chưa chọn đáp án cho câu này
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-5 py-3.5 border-t border-ink-100 flex justify-end">
                    <button
                        onClick={() => setReviewing(false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-ink-600 border border-ink-200 hover:bg-ink-50 transition-colors"
                    >
                        Quay lại kết quả
                    </button>
                </div>
            </div>
        );
    }

    // ── Làm bài ───────────────────────────────────────────
    return (
        <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
            <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-ink-900">{quiz.title}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-ink-100 text-ink-500">
                    Câu {step + 1}/{quiz.questions.length}
                </span>
            </div>

            <div className="h-1 bg-ink-100">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                    animate={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                >
                    <p className="text-sm text-ink-800 leading-relaxed mb-4">{question.content}</p>
                    <div className="space-y-2">
                        {question.options.map((opt) => {
                            const isSelected = selectedOptionId === opt.optionId;
                            return (
                                <button
                                    key={opt.optionId}
                                    onClick={() => selectOption(opt.optionId)}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium transition-all ${
                                        isSelected
                                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                                            : 'border-ink-200 text-ink-700 hover:border-amber-200 hover:bg-amber-50/40'
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-amber-500 bg-amber-500' : 'border-ink-300'}`} />
                                    {opt.content}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="px-5 py-3.5 border-t border-ink-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] text-ink-400">
                    <Clock className="w-3.5 h-3.5" />
                    Còn {quiz.timeLimitMinutes} phút · Cần đúng {quiz.passPercentage}% để qua bài
                </span>
                <div className="flex items-center gap-2">
                    {step > 0 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-ink-500 hover:bg-ink-50 transition-colors"
                        >
                            Câu trước
                        </button>
                    )}
                    {isLast ? (
                        <button
                            onClick={finishQuiz}
                            disabled={selectedOptionId == null || submitting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? 'Đang nộp...' : 'Nộp bài'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setStep((s) => s + 1)}
                            disabled={selectedOptionId == null}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Câu tiếp theo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPanel;
