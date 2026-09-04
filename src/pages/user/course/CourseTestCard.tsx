import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Lock, Clock, ListChecks, GraduationCap } from 'lucide-react';
import type { CourseTest } from '../../../types/quiz';

interface Props {
    test: CourseTest;
    courseId: number;
    onStart?: () => void;
}

const CourseTestCard: React.FC<Props> = ({ test, courseId, onStart }) => {
    const navigate = useNavigate();
    const passed = !!test.lastAttempt?.isPassed;
    return (
    <div className="bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">
        <div className="p-4 flex gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${test.unlocked ? 'bg-amber-100' : 'bg-ink-100'}`}>
                {test.unlocked ? (
                    <Award className="w-5 h-5 text-amber-600" />
                ) : (
                    <Lock className="w-4 h-4 text-ink-400" />
                )}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 leading-snug">{test.title}</p>
                <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] text-ink-400">
                        <ListChecks className="w-3 h-3" /> {test.questionCount} câu
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-400">
                        <Clock className="w-3 h-3" /> {test.timeLimitMinutes} phút
                    </span>
                </div>
            </div>
        </div>

        {test.unlocked ? (
            <>
                <div className="px-4 pb-3">
                    <div className="bg-ink-50 rounded-xl px-3 py-2 text-[11px] text-ink-500">
                        Cần đạt <span className="font-semibold text-ink-700">{test.passPercentage}%</span> để hoàn thành khóa học và nhận chứng chỉ.
                    </div>
                </div>
                <div className="px-4 py-3 border-t border-ink-100 flex items-center justify-between">
                    {test.lastAttempt ? (
                        <span className="text-[11px] text-ink-400">
                            Lần gần nhất:{' '}
                            <span className={`font-bold ${test.lastAttempt.isPassed ? 'text-code-600' : 'text-rose-600'}`}>
                                {test.lastAttempt.percentageScore}%
                            </span>{' '}
                            · {test.lastAttempt.isPassed ? 'Đã đạt' : 'Chưa đạt'}
                        </span>
                    ) : (
                        <span className="text-[11px] text-ink-400">Chưa làm lần nào</span>
                    )}
                    <button
                        onClick={onStart}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 transition-colors"
                    >
                        {test.lastAttempt ? 'Làm lại bài test' : 'Bắt đầu làm bài'}
                    </button>
                </div>
                {passed && (
                    <div className="px-4 py-3 border-t border-amber-100 bg-amber-50/60 flex items-center justify-between">
                        <span className="text-[11px] text-amber-700 font-medium">Khóa học đã hoàn thành</span>
                        <button
                            onClick={() => navigate(`/certificates/${courseId}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors"
                        >
                            <GraduationCap className="w-3.5 h-3.5" /> Xem chứng chỉ
                        </button>
                    </div>
                )}
            </>
        ) : (
            <div className="px-4 pb-4 text-[11px] text-ink-400">
                Hoàn thành hết bài học và quiz trong khóa để mở khóa bài test.
            </div>
        )}
    </div>
    );
};

export default CourseTestCard;
