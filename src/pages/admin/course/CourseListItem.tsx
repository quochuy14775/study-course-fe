import React from 'react';
import { Tag, Trash2, ChevronRight, Star, Image as ImageIcon } from 'lucide-react';
import { CourseUI, Level } from '../../../types/course';
import LessonSummary from './lesson/LessonSummary';

interface Props {
    course: CourseUI;
    onClick?: (id: number) => void;
    onDelete?: (id: number) => void;
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    Beginner:     { bg: 'bg-code-50',  text: 'text-code-700',   dot: 'bg-code-500' },
    Intermediate: { bg: 'bg-amber-50', text: 'text-amber-700',  dot: 'bg-amber-500' },
    Advanced:     { bg: 'bg-rose-50',  text: 'text-rose-700',   dot: 'bg-rose-500' },
};

const levelLabel = (l: any): string => {
    if (typeof l === 'string') return l;
    if (typeof l === 'number') return (Level[l] as string) ?? 'Beginner';
    return 'Beginner';
};

const CourseListItem: React.FC<Props> = ({ course, onClick, onDelete }) => {
    const levelKey = levelLabel(course.level);
    const levelStyle = LEVEL_STYLES[levelKey] ?? LEVEL_STYLES.Beginner;

    return (
        <div
            onClick={() => onClick && onClick(course.id)}
            className="card-lift group cursor-pointer bg-white border border-ink-200 hover:border-primary-300 rounded-2xl shadow-soft overflow-hidden mb-3 transition-all"
        >
            <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-14 sm:w-32 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 border border-ink-200">
                    {course.imageUrl ? (
                        <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-primary-400" />
                        </div>
                    )}
                    {course.isFeatured && (
                        <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/95 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm">
                            <Star size={9} fill="white" /> FEATURED
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-ink-900 truncate group-hover:text-primary-700 transition-colors">
                            {course.title}
                        </h3>
                        {!course.isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-100 text-ink-500 text-[10px] font-semibold flex-shrink-0">
                                <span className="w-1 h-1 rounded-full bg-ink-400" />
                                INACTIVE
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">
                        {course.description || <span className="italic text-ink-400">Chưa có mô tả</span>}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        {/* Level */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${levelStyle.bg} ${levelStyle.text}`}>
                            <span className={`w-1 h-1 rounded-full ${levelStyle.dot}`} />
                            {levelKey}
                        </span>

                        {/* Price */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-primary-50 text-primary-700">
                            <Tag size={10} />
                            {course.price === 0
                                ? 'FREE'
                                : course.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </span>

                        {/* Course stats (chapters + lessons + duration) */}
                        <LessonSummary courseId={course.id} compact />

                        {/* Instructor */}
                        {course.instructor && course.instructor !== 'Unknown' && (
                            <span className="ml-auto text-[11px] text-ink-500 font-mono truncate max-w-[160px]">
                                @{course.instructor}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right actions */}
                <div className="flex flex-col items-end justify-between flex-shrink-0">
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(course.id); }}
                            className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa khóa học"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    <div className="flex items-center gap-1 text-xs text-ink-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all">
                        <span className="font-medium hidden sm:inline">Curriculum</span>
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseListItem;
