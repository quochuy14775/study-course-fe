import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    GripVertical, ChevronDown, Plus, Pencil, Trash2, MoreVertical,
    PlayCircle, Clock, FolderPlus, FileVideo, Move, Check, X,
} from 'lucide-react';
import {
    DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
    closestCenter, DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { Lesson } from '../../../../types/lesson';
import { useChapters, type Chapter } from '../../../../hooks/useChapters';

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

const formatDuration = (seconds: number): string => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

// ---------------------------------------------------------------------------
// Sortable Lesson Row
// ---------------------------------------------------------------------------

interface SortableLessonProps {
    lesson: Lesson;
    indexInChapter: number;
    chapters: Chapter[];
    currentChapterId: string;
    onEdit: () => void;
    onDelete: () => void;
    onMoveToChapter: (targetChapterId: string) => void;
}

const SortableLesson: React.FC<SortableLessonProps> = ({
    lesson, indexInChapter, chapters, currentChapterId, onEdit, onDelete, onMoveToChapter,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `lesson:${lesson.id}`,
    });
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        window.addEventListener('mousedown', handler);
        return () => window.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const otherChapters = chapters.filter((c) => c.id !== currentChapterId);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center gap-3 px-3 py-2.5 bg-white border border-ink-200 rounded-xl hover:border-primary-300 hover:shadow-soft transition-all"
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-ink-300 hover:text-ink-600 transition-colors p-1 -ml-1"
                aria-label="Drag to reorder"
            >
                <GripVertical size={16} />
            </button>

            {/* Index */}
            <span className="text-xs font-mono font-semibold text-ink-400 w-8 text-right">
                {String(indexInChapter + 1).padStart(2, '0')}
            </span>

            {/* Thumbnail / icon */}
            <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-ink-100 flex items-center justify-center">
                {lesson.thumbnailUrl ? (
                    <img src={lesson.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <FileVideo size={16} className="text-ink-400" />
                )}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate group-hover:text-primary-700 transition-colors">
                    {lesson.title || <span className="text-ink-400 italic">Bài học không có tiêu đề</span>}
                </p>
                <div className="flex items-center gap-3 text-xs text-ink-500 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                        <Clock size={11} />
                        {formatDuration(lesson.duration ?? 0)}
                    </span>
                    {lesson.videoId && (
                        <span className="flex items-center gap-1 font-mono truncate max-w-[180px]">
                            <PlayCircle size={11} />
                            {lesson.videoId}
                        </span>
                    )}
                    {!lesson.isActive && (
                        <span className="px-1.5 py-0.5 rounded bg-ink-100 text-ink-500 text-[10px] font-semibold">
                            DRAFT
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="p-2 rounded-lg text-ink-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Chỉnh sửa"
                >
                    <Pencil size={14} />
                </button>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-2 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
                        title="Thêm hành động"
                    >
                        <MoreVertical size={14} />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-ink-200 rounded-xl shadow-soft-lg z-20 overflow-hidden animate-fade-in-up">
                            {otherChapters.length > 0 && (
                                <>
                                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400 border-b border-ink-100 flex items-center gap-1.5">
                                        <Move size={11} /> Chuyển sang chương
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {otherChapters.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    onMoveToChapter(c.id);
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-primary-50 hover:text-primary-700 truncate transition-colors"
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="border-t border-ink-100" />
                                </>
                            )}
                            <button
                                onClick={() => {
                                    onDelete();
                                    setMenuOpen(false);
                                }}
                                className="w-full px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={13} />
                                Xóa bài học
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Sortable Chapter Section
// ---------------------------------------------------------------------------

interface SortableChapterProps {
    chapter: Chapter;
    chapters: Chapter[];
    lessons: Lesson[];
    isUncategorized: boolean;
    onToggle: () => void;
    onRename: (title: string) => void;
    onDelete: () => void;
    onEditLesson: (lesson: Lesson) => void;
    onDeleteLesson: (id: number) => void;
    onMoveLessonToChapter: (lessonId: number, targetId: string) => void;
    onReorderLessons: (oldIndex: number, newIndex: number) => void;
}

const SortableChapter: React.FC<SortableChapterProps> = ({
    chapter, chapters, lessons, isUncategorized, onToggle, onRename, onDelete,
    onEditLesson, onDeleteLesson, onMoveLessonToChapter, onReorderLessons,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `chapter:${chapter.id}`,
        disabled: isUncategorized,
    });

    const [editing, setEditing] = useState(false);
    const [titleDraft, setTitleDraft] = useState(chapter.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const lessonsInChapter = chapter.lessonIds
        .map((id) => lessons.find((l) => l.id === id))
        .filter((l): l is Lesson => !!l);

    const totalDuration = lessonsInChapter.reduce((sum, l) => sum + (l.duration ?? 0), 0);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = chapter.lessonIds.findIndex((id) => `lesson:${id}` === active.id);
        const newIndex = chapter.lessonIds.findIndex((id) => `lesson:${id}` === over.id);
        if (oldIndex >= 0 && newIndex >= 0) onReorderLessons(oldIndex, newIndex);
    };

    const commitRename = () => {
        const t = titleDraft.trim();
        if (t && t !== chapter.title) onRename(t);
        else setTitleDraft(chapter.title);
        setEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border border-ink-200 rounded-2xl shadow-soft overflow-hidden"
        >
            {/* Chapter header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-ink-50/80 to-primary-50/30 border-b border-ink-200">
                {!isUncategorized && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-ink-300 hover:text-ink-600 transition-colors p-1 -ml-1"
                        aria-label="Drag chapter"
                    >
                        <GripVertical size={16} />
                    </button>
                )}

                <button
                    onClick={onToggle}
                    className="p-1 rounded-lg hover:bg-white/60 text-ink-500 transition-colors"
                    aria-label={chapter.collapsed ? 'Mở chương' : 'Thu gọn chương'}
                >
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${chapter.collapsed ? '-rotate-90' : ''}`}
                    />
                </button>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                    {editing ? (
                        <div className="flex items-center gap-1 flex-1">
                            <input
                                ref={inputRef}
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitRename();
                                    if (e.key === 'Escape') {
                                        setTitleDraft(chapter.title);
                                        setEditing(false);
                                    }
                                }}
                                className="flex-1 bg-white border border-primary-400 rounded-lg px-2 py-1 text-sm font-bold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
                            />
                            <button
                                onClick={commitRename}
                                className="p-1 rounded-md text-code-600 hover:bg-code-50"
                            >
                                <Check size={14} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <h3 className="font-bold text-ink-900 truncate">{chapter.title}</h3>
                            {!isUncategorized && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="p-1 rounded text-ink-400 hover:text-primary-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                                    title="Đổi tên"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-ink-600 font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-ink-200">
                        {lessonsInChapter.length} bài
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1">
                        <Clock size={11} /> {formatDuration(totalDuration)}
                    </span>
                </div>

                {!isUncategorized && (
                    <button
                        onClick={() => {
                            if (window.confirm(`Xóa chương "${chapter.title}"? Bài học sẽ chuyển về "Chưa phân loại".`)) {
                                onDelete();
                            }
                        }}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa chương"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Lessons list */}
            {!chapter.collapsed && (
                <div className="p-3">
                    {lessonsInChapter.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-ink-400">Chưa có bài học trong chương này</p>
                            <p className="text-xs text-ink-400 mt-1">Kéo thả bài học từ chương khác hoặc thêm mới</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={lessonsInChapter.map((l) => `lesson:${l.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {lessonsInChapter.map((lesson, i) => (
                                        <SortableLesson
                                            key={lesson.id}
                                            lesson={lesson}
                                            indexInChapter={i}
                                            chapters={chapters}
                                            currentChapterId={chapter.id}
                                            onEdit={() => onEditLesson(lesson)}
                                            onDelete={() => onDeleteLesson(lesson.id)}
                                            onMoveToChapter={(target) => onMoveLessonToChapter(lesson.id, target)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main CurriculumBuilder
// ---------------------------------------------------------------------------

interface CurriculumBuilderProps {
    courseId: number | string;
    lessons: Lesson[];
    onAddLesson: () => void;
    onEditLesson: (lesson: Lesson) => void;
    onDeleteLesson: (id: number) => void;
}

const CurriculumBuilder: React.FC<CurriculumBuilderProps> = ({
    courseId, lessons, onAddLesson, onEditLesson, onDeleteLesson,
}) => {
    const allLessonIds = useMemo(() => lessons.map((l) => l.id), [lessons]);
    const {
        chapters, addChapter, renameChapter, deleteChapter, toggleCollapse,
        reorderChapters, reorderLessonsInChapter, moveLessonToChapter, UNCATEGORIZED_ID,
    } = useChapters(courseId, allLessonIds);

    const [addingChapter, setAddingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const newChapterInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (addingChapter) newChapterInputRef.current?.focus();
    }, [addingChapter]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor),
    );

    const handleChapterDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const ids = chapters.map((c) => `chapter:${c.id}`);
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        if (oldIndex >= 0 && newIndex >= 0) reorderChapters(oldIndex, newIndex);
    };

    const handleAddChapter = () => {
        const t = newChapterTitle.trim();
        if (t) {
            addChapter(t);
            setNewChapterTitle('');
            setAddingChapter(false);
        }
    };

    // Overall stats
    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((s, l) => s + (l.duration ?? 0), 0);
    const activeChapters = chapters.filter((c) => c.id !== UNCATEGORIZED_ID || c.lessonIds.length > 0);

    return (
        <div className="space-y-4">
            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <StatCard icon={<FileVideo size={18} />} label="Tổng bài học" value={String(totalLessons)} />
                <StatCard icon={<FolderPlus size={18} />} label="Số chương" value={String(activeChapters.length)} />
                <StatCard icon={<Clock size={18} />} label="Thời lượng" value={formatDuration(totalDuration)} />
            </div>

            {/* Chapters */}
            {chapters.length === 0 ? (
                <EmptyState onAddLesson={onAddLesson} />
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    onDragEnd={handleChapterDragEnd}
                >
                    <SortableContext
                        items={chapters.map((c) => `chapter:${c.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {chapters.map((chapter) => (
                                <SortableChapter
                                    key={chapter.id}
                                    chapter={chapter}
                                    chapters={chapters}
                                    lessons={lessons}
                                    isUncategorized={chapter.id === UNCATEGORIZED_ID}
                                    onToggle={() => toggleCollapse(chapter.id)}
                                    onRename={(t) => renameChapter(chapter.id, t)}
                                    onDelete={() => deleteChapter(chapter.id)}
                                    onEditLesson={onEditLesson}
                                    onDeleteLesson={onDeleteLesson}
                                    onMoveLessonToChapter={moveLessonToChapter}
                                    onReorderLessons={(o, n) => reorderLessonsInChapter(chapter.id, o, n)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Action row */}
            <div className="flex flex-col sm:flex-row gap-2">
                {addingChapter ? (
                    <div className="flex-1 flex items-center gap-2 bg-white border-2 border-primary-400 rounded-xl px-3 py-2 shadow-soft animate-fade-in">
                        <FolderPlus size={16} className="text-primary-600" />
                        <input
                            ref={newChapterInputRef}
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddChapter();
                                if (e.key === 'Escape') {
                                    setNewChapterTitle('');
                                    setAddingChapter(false);
                                }
                            }}
                            placeholder="Tên chương mới (vd: Chương 1 - Giới thiệu)"
                            className="flex-1 text-sm bg-transparent outline-none placeholder:text-ink-400"
                        />
                        <button
                            onClick={handleAddChapter}
                            disabled={!newChapterTitle.trim()}
                            className="px-3 py-1 text-xs font-semibold bg-primary-600 text-white rounded-lg disabled:opacity-40"
                        >
                            Tạo
                        </button>
                        <button
                            onClick={() => {
                                setNewChapterTitle('');
                                setAddingChapter(false);
                            }}
                            className="p-1 text-ink-400 hover:text-ink-700"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setAddingChapter(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ink-300 text-ink-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl font-semibold text-sm transition-all"
                    >
                        <FolderPlus size={16} />
                        Tạo chương mới
                    </button>
                )}
                <button
                    onClick={onAddLesson}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={16} />
                    Thêm bài học
                </button>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="bg-white border border-ink-200 rounded-2xl p-4 shadow-soft">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center text-primary-600">
                {icon}
            </div>
            <div>
                <p className="text-xl font-extrabold text-ink-900 leading-none font-mono">{value}</p>
                <p className="text-xs text-ink-500 mt-1">{label}</p>
            </div>
        </div>
    </div>
);

const EmptyState: React.FC<{ onAddLesson: () => void }> = ({ onAddLesson }) => (
    <div className="bg-white border-2 border-dashed border-ink-300 rounded-3xl py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 mx-auto mb-4 flex items-center justify-center">
            <FileVideo className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-bold text-ink-900 mb-1">Chưa có bài học nào</h3>
        <p className="text-sm text-ink-500 mb-5">Bắt đầu xây dựng curriculum cho khóa học của bạn</p>
        <button
            onClick={onAddLesson}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-105 transition-transform"
        >
            <Plus size={16} />
            Thêm bài học đầu tiên
        </button>
    </div>
);

export default CurriculumBuilder;
