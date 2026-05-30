import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Lesson } from '../../../../types/lesson';

interface Props {
    lesson: Lesson | null;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}

const DeleteLessonDialog: React.FC<Props> = ({ lesson, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    if (!lesson) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm(lesson.id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />

            <div className="relative w-full max-w-sm bg-white border border-ink-200 rounded-3xl shadow-soft-lg overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-5 py-4 border-b border-ink-200 bg-rose-50/60">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                            </div>
                            <h2 className="text-lg font-bold text-ink-900">Xóa bài học</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-white/60 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-5">
                    <p className="text-sm text-ink-600 mb-3">
                        Bạn có chắc muốn xóa bài học này không?
                    </p>
                    <div className="p-3 rounded-xl bg-ink-50 border border-ink-200 flex items-center gap-3">
                        {lesson.thumbnailUrl ? (
                            <img
                                src={lesson.thumbnailUrl}
                                alt={lesson.title}
                                className="w-16 h-10 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-16 h-10 rounded-lg bg-primary-50 border border-ink-200 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-ink-900 text-sm truncate">{lesson.title}</p>
                            {lesson.duration ? (
                                <p className="text-xs text-ink-500 mt-0.5">
                                    {Math.floor(lesson.duration / 60)}p {lesson.duration % 60}s
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <p className="text-xs text-rose-500 mt-3 flex items-center gap-1.5">
                        <AlertTriangle size={11} />
                        Hành động này không thể hoàn tác.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 px-5 py-4 border-t border-ink-200 bg-ink-50/50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-ink-700 bg-white border border-ink-300 rounded-xl hover:bg-ink-50 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang xóa...</>
                        ) : (
                            <><Trash2 size={15} /> Xóa bài học</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteLessonDialog;
