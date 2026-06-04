import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../../../../components/CustomToast';
import { ChevronLeft, Settings, BookOpen, Loader2, Eye } from 'lucide-react';
import lessonService from '../../../../services/lessonService';
import courseService from '../../../../services/courseServices';
import { Lesson, LessonRequest } from '../../../../types/lesson';
import LessonFormDialog from './LessonFormDialog';
import DeleteLessonDialog from './DeleteLessonDialog';
import CurriculumBuilder from './CurriculumBuilder';

interface LocationState {
    courseTitle?: string;
}

interface CourseInfo {
    id: number;
    title: string;
    description?: string;
    level?: string | number;
    isActive?: boolean;
}

type Tab = 'curriculum' | 'info';

const LessonManagement: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const [course, setCourse] = useState<CourseInfo | null>(
        state?.courseTitle ? { id: Number(courseId), title: state.courseTitle } : null,
    );
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Lesson | null>(null);
    const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
    const [tab, setTab] = useState<Tab>('curriculum');

    /* Fetch course + lessons */
    useEffect(() => {
        if (!courseId) return;
        let mounted = true;

        const fetchAll = async () => {
            try {
                setLoading(true);
                const [courseData, lessonsData] = await Promise.all([
                    courseService.getCourseById(courseId).catch(() => null),
                    lessonService.getLessons(Number(courseId)),
                ]);

                if (!mounted) return;

                if (courseData) {
                    setCourse({
                        id: Number(courseData.id ?? courseId),
                        title: courseData.title ?? state?.courseTitle ?? 'Khóa học',
                        description: courseData.description,
                        level: courseData.level,
                        isActive: courseData.isActive,
                    });
                }

                const list = lessonsData?.value ?? [];
                const mapped: Lesson[] = list.map((r: any) => ({
                    id: Number(r.id),
                    orderIndex: r.orderIndex ?? 0,
                    title: r.title ?? '',
                    description: r.description ?? null,
                    videoId: r.videoId ?? '',
                    duration: r.duration ?? 0,
                    thumbnailUrl: r.thumbnailUrl ?? null,
                    isPreview: r.isPreview ?? false,
                    courseId: Number(courseId),
                    chapterId: r.chapterId ?? null,
                    createdAt: r.createdAt ?? new Date().toISOString(),
                    updatedAt: r.updatedAt ?? null,
                    isDeleted: r.isDeleted ?? false,
                    isActive: r.isActive ?? true,
                }));
                // Sort by orderIndex
                mapped.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                setLessons(mapped);
            } catch (err) {
                console.error(err);
                showToast.error('Không tải được dữ liệu khóa học');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchAll();
        return () => { mounted = false; };
    }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

    const openCreate = () => { setEditing(null); setOpenForm(true); };
    const openEdit = (l: Lesson) => { setEditing(l); setOpenForm(true); };

    /**
     * Bulk-create lessons. BE requires a chapter: defaults to a new chapter
     * named "Chương mới" (admin can rename later via inline-edit in CurriculumBuilder).
     * Future: dialog should let admin pick existing chapter or set chapter title.
     */
    const handleCreate = async (payloads: LessonRequest[]) => {
        if (!courseId) return;
        try {
            const { lessons: created, chapterTitle } = await lessonService.createLessons(
                Number(courseId),
                { lessons: payloads }, // không có chapter → BE trả về chapterId null → FE xếp vào "Chưa phân loại"
            );
            const mapped: Lesson[] = (created || []).map((r: any) => ({
                id: Number(r.id),
                orderIndex: r.orderIndex ?? 0,
                title: r.title ?? '',
                description: r.description ?? null,
                videoId: r.videoId ?? '',
                duration: r.duration ?? 0,
                thumbnailUrl: r.thumbnailUrl ?? null,
                isPreview: r.isPreview ?? false,
                courseId: Number(courseId),
                chapterId: r.chapterId ?? null,
                createdAt: r.createdAt ?? new Date().toISOString(),
                updatedAt: r.updatedAt ?? null,
                isDeleted: r.isDeleted ?? false,
                isActive: r.isActive ?? true,
            }));
            setLessons((prev) => [...prev, ...mapped]);
            showToast.success(`Đã thêm ${mapped.length} bài học vào chương "${chapterTitle}"`);
            setOpenForm(false);
        } catch (err) {
            console.error(err);
            showToast.error('Tạo bài học thất bại');
        }
    };

    const handleUpdate = async (id: string | number, payload: LessonRequest) => {
        if (!courseId) return;
        try {
            const updated = await lessonService.updateLesson(Number(courseId), Number(id), payload);
            setLessons((prev) => prev.map((l) => (
                String(l.id) === String(id)
                    ? { ...l, ...updated, id: Number(updated.id ?? l.id) }
                    : l
            )));
            showToast.success('Cập nhật bài học thành công');
            setOpenForm(false);
        } catch (err) {
            console.error(err);
            showToast.error('Cập nhật thất bại');
        }
    };

    const handleDelete = async (id: number) => {
        if (!courseId) return;
        const original = [...lessons];
        setLessons((prev) => prev.filter((l) => l.id !== id));
        setDeletingLesson(null);

        try {
            await lessonService.deleteLessons(Number(courseId), [id]);
            showToast.success('Đã xóa bài học');
        } catch (err) {
            console.error(err);
            showToast.error('Xóa thất bại');
            setLessons(original);
        }
    };

    return (
        <div className="min-h-screen bg-ink-50 relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />

            <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
                {/* Breadcrumb */}
                <button
                    onClick={() => navigate('/management')}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-primary-600 mb-4 group transition-colors"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Quản lý khóa học</span>
                </button>

                {/* Course header */}
                <div className="mb-6 animate-fade-in-up">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                                <span className="text-ink-400">~/management/</span>
                                <span className="truncate">{course?.title ? 'course' : '...'}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 truncate">
                                {course?.title ?? 'Đang tải...'}
                            </h1>
                            {course?.description && (
                                <p className="text-sm text-ink-600 mt-2 line-clamp-2">{course.description}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            {course?.isActive !== undefined && (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                    course.isActive
                                        ? 'bg-code-50 text-code-700'
                                        : 'bg-ink-100 text-ink-500'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${course.isActive ? 'bg-code-500' : 'bg-ink-400'}`} />
                                    {course.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
                                </span>
                            )}
                            <button
                                className="p-2 rounded-lg bg-white border border-ink-200 text-ink-600 hover:text-primary-600 hover:border-primary-300 transition-colors"
                                title="Xem thử khóa học"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-6 bg-white border border-ink-200 rounded-xl p-1 w-fit shadow-soft">
                    <TabButton active={tab === 'curriculum'} onClick={() => setTab('curriculum')} icon={<BookOpen size={14} />}>
                        Curriculum
                    </TabButton>
                    <TabButton active={tab === 'info'} onClick={() => setTab('info')} icon={<Settings size={14} />}>
                        Thông tin
                    </TabButton>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-white border border-ink-200 rounded-3xl py-20 text-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-ink-500">Đang tải dữ liệu...</p>
                    </div>
                ) : tab === 'curriculum' ? (
                    <div className="animate-fade-in">
                        <CurriculumBuilder
                            courseId={Number(courseId)}
                            lessons={lessons}
                            onAddLesson={openCreate}
                            onEditLesson={openEdit}
                            onDeleteLesson={(id) => setDeletingLesson(lessons.find(l => l.id === id) ?? null)}
                        />
                    </div>
                ) : (
                    <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-soft animate-fade-in">
                        <h3 className="text-lg font-bold text-ink-900 mb-4">Thông tin khóa học</h3>
                        <div className="space-y-3 text-sm">
                            <InfoRow label="Tên khóa học" value={course?.title ?? '—'} />
                            <InfoRow label="Mô tả" value={course?.description ?? '—'} />
                            <InfoRow label="Cấp độ" value={String(course?.level ?? '—')} />
                            <InfoRow label="Trạng thái" value={course?.isActive ? 'Hoạt động' : 'Tạm ẩn'} />
                        </div>
                        <p className="text-xs text-ink-400 mt-6 font-mono">
                            {/* TODO: Chuyển sang form chỉnh sửa inline */}
                        </p>
                    </div>
                )}

                {openForm && (
                    <LessonFormDialog
                        open={openForm}
                        onClose={() => setOpenForm(false)}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        editing={editing}
                    />
                )}

                <DeleteLessonDialog
                    lesson={deletingLesson}
                    onClose={() => setDeletingLesson(null)}
                    onConfirm={handleDelete}
                />
            </div>
        </div>
    );
};

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            active
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow-primary'
                : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
        }`}
    >
        {icon}
        {children}
    </button>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex gap-4">
        <span className="text-ink-500 w-32 flex-shrink-0">{label}</span>
        <span className="text-ink-900 font-medium">{value}</span>
    </div>
);

export default LessonManagement;

