import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Clock, Loader2, CheckCircle2, ListChecks, BarChart3, Award } from 'lucide-react';
import { Course, formatDurationSeconds } from '../types/course';

interface EnrollConfirmModalProps {
    /** Khóa đang chờ xác nhận. null = đóng modal. */
    course: Course | null;
    /** Đang gọi API enroll — khóa nút để tránh double-submit. */
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

const PERKS = [
    { icon: ListChecks, text: 'Thêm vào "Khóa học của tôi"' },
    { icon: BarChart3,  text: 'Ghi nhận tiến độ từng bài học' },
    { icon: Award,      text: 'Nhận chứng chỉ khi hoàn thành bài kiểm tra' },
];

/**
 * Xác nhận ghi danh khóa học miễn phí. Khóa có phí đi qua CheckoutModal thay vì modal này.
 */
const EnrollConfirmModal: React.FC<EnrollConfirmModalProps> = ({
    course,
    loading = false,
    onCancel,
    onConfirm,
}) => {
    // Giữ lại khóa cuối cùng để nội dung không biến mất giữa chừng animation đóng
    // (lúc đó course đã về null rồi).
    const lastCourse = useRef<Course | null>(null);
    if (course) lastCourse.current = course;
    const shown = course ?? lastCourse.current;

    // Portal thẳng ra body: card gọi modal này thường nằm trong 1 motion.div có
    // whileHover (Framer Motion set transform lên nó) + overflow-hidden. `fixed` bên trong
    // ancestor có transform bị nhốt trong ancestor đó thay vì phủ viewport — dialog sẽ bị
    // cắt gọn trong khung course thay vì che kín màn hình.
    return createPortal(
        <AnimatePresence>
            {course && shown && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Drag handle — mobile only */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-ink-200" />
                        </div>

                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center disabled:opacity-40 transition-colors"
                        >
                            <X size={15} className="text-ink-500" />
                        </button>

                        {/* ── Header ── */}
                        <div className="relative overflow-hidden px-6 pt-6 pb-5">
                            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary-100 blur-3xl opacity-60 pointer-events-none" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-code-100 blur-3xl opacity-60 pointer-events-none" />

                            <span className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-code-50 border border-code-200 text-[11px] font-bold text-code-700 mb-3">
                                <CheckCircle2 size={12} /> Miễn phí
                            </span>

                            <h2 className="relative z-10 text-xl font-extrabold text-ink-900 leading-snug mb-1.5">
                                Đăng ký khóa học này?
                            </h2>
                            <p className="relative z-10 text-sm text-ink-500 leading-relaxed">
                                Bạn sắp ghi danh vào{' '}
                                <span className="font-semibold text-ink-800">{shown.title}</span>.
                            </p>

                            {/* Meta */}
                            <div className="relative z-10 flex items-center gap-3 mt-3 text-[11px] text-ink-400">
                                {shown.lessonCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" />{shown.lessonCount} bài học
                                    </span>
                                )}
                                {shown.totalDurationSeconds > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />{formatDurationSeconds(shown.totalDurationSeconds)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ── Perks ── */}
                        <div className="px-6 pb-5">
                            <div className="space-y-2.5">
                                {PERKS.map(({ icon: Icon, text }) => (
                                    <div key={text} className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                            <Icon size={14} className="text-primary-600" />
                                        </div>
                                        <span className="text-sm text-ink-600">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── CTA ── */}
                        <div className="px-6 pb-6 space-y-2.5">
                            <motion.button
                                whileHover={loading ? undefined : { scale: 1.015 }}
                                whileTap={loading ? undefined : { scale: 0.97 }}
                                onClick={onConfirm}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm shadow-glow-primary hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Đang đăng ký...</>
                                ) : (
                                    <>Xác nhận đăng ký</>
                                )}
                            </motion.button>

                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="w-full py-3.5 rounded-2xl border-2 border-ink-200 text-ink-700 font-semibold text-sm hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 disabled:opacity-40 transition-all"
                            >
                                Để sau
                            </button>
                        </div>

                        <div className="sm:hidden h-2" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};

export default EnrollConfirmModal;
