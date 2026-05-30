import React, { useState, useEffect } from 'react';
import { showToast } from "../../../components/CustomToast";
import {
    Plus, Search, ChevronLeft, ChevronRight,
    List, Gift, DollarSign, Leaf, TrendingUp, Flame
} from 'lucide-react';
import { CourseRequest, CourseUI, mapCourseToUI } from "../../../types/course";
import AddCourseDialog from "./AddCourseDialog";
import EditCourseDialog from "./EditCourseDialog";
import DeleteCourseDialog from "./DeleteCourseDialog";
import CustomDropdown from "../../../components/CustomDropdown";
import courseService from "../../../services/courseServices";
import {ITEMS_PER_PAGE} from "../../../types/odata";
import CourseListItem from './CourseListItem';
import { useNavigate } from 'react-router-dom';

const CourseManagement: React.FC = () => {
    const [courses, setCourses]         = useState<CourseUI[]>([]);
    const [totalCount, setTotalCount]   = useState(0);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);

    const [showAddCourseModal, setShowAddCourseModal] = useState(false);
    const [editingCourse, setEditingCourse]           = useState<CourseUI | null>(null);
    const [deletingCourse, setDeletingCourse]         = useState<CourseUI | null>(null);

    // UI-only state (does NOT directly trigger fetch)
    const [searchInput, setSearchInput] = useState(''); // immediate input value for debounce

    // Query state (single source of truth for API fetches)
    const [query, setQuery] = useState({ search: '', level: '', price: '', page: 1 });

    const navigate = useNavigate();

    /* ── Build OData filter string from query ── */
    const buildFilter = (search: string, level: string, price: string): string | undefined => {
        const clauses: string[] = [];

        if (search.trim()) {
            // OData 'contains' for title and description
            clauses.push(
                `(contains(tolower(Title),'${search.toLowerCase()}') or contains(tolower(Description),'${search.toLowerCase()}'))`
            );
        }
        if (level) {
            clauses.push(`Level eq '${level}'`);
        }
        if (price === 'free') {
            clauses.push(`Price eq 0`);
        } else if (price === 'paid') {
            clauses.push(`Price gt 0`);
        }

        return clauses.length > 0 ? clauses.join(' and ') : undefined;
    };

    /* ── Single effect for data fetching based on query ── */
    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try {
                setLoading(true);
                setError(null);

                const filter = buildFilter(query.search, query.level, query.price);

                const data = await courseService.getCourses({
                    count:   true,
                    top:     ITEMS_PER_PAGE,
                    skip:    (query.page - 1) * ITEMS_PER_PAGE,
                    orderby: 'CreatedAt desc',
                    ...(filter && { filter }),
                });

                if (!mounted) return;

                setCourses((data.value || []).map(mapCourseToUI));
                setTotalCount(data.count ?? 0);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                if (!mounted) return;
                setError('Failed to load courses. Please try again.');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetch();

        return () => { mounted = false; };
    }, [query.search, query.level, query.price, query.page]);

    /* ── Derived pagination ── */
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    /* ── Debounce searchInput -> update query.search (and reset to page 1) ── */
    useEffect(() => {
        const id = setTimeout(() => {
            setQuery(prev => {
                const trimmedSearch = searchInput.trim();
                if (prev.search === trimmedSearch) return prev;
                return { ...prev, search: trimmedSearch, page: 1 };
            });
        }, 500);

        return () => clearTimeout(id);
    }, [searchInput]);

    /* ── Filter handlers: update query state only ── */
    const handleFilterChange = (type: 'level' | 'price', value: string) => {
        setQuery(prev => {
            if (type === 'level') {
                if (prev.level === value) return prev;
                return { ...prev, level: value, page: 1 };
            } else {
                if (prev.price === value) return prev;
                return { ...prev, price: value, page: 1 };
            }
        });
    };
    const handleResetFilters = () => {
        setSearchInput('');
        setQuery({ search: '', level: '', price: '', page: 1 });
    };

    /* ── Course handlers (optimistic updates where possible) ── */
    const handleAddCourse = async (data: CourseRequest) => {
        try {
            const response = await courseService.createCourse(data);
            const newCourse: CourseUI = mapCourseToUI(response);

            // Optimistically insert into current page (at top)
            setCourses(prev => {
                const next = [newCourse, ...prev];
                if (next.length > ITEMS_PER_PAGE) next.pop();
                return next;
            });

            setTotalCount(prev => prev + 1);
            showToast.success("Tạo khóa học thành công! Hãy thêm bài học ngay.");
            setShowAddCourseModal(false);
            // Auto-redirect to curriculum builder so admin doesn't forget to add lessons
            const newId = response?.id ?? newCourse.id;
            if (newId) {
                navigate(`/management/courses/${newId}/lessons`, { state: { courseTitle: newCourse.title } });
            }
            return response;
        } catch (err: any) {
            console.error("Create failed", err);
            // If validation error (400), rethrow so dialog can display field errors
            if (err?.response?.status === 400) {
                throw err;
            }
            showToast.error(err.response?.data?.message || 'Create failed');
            throw err;
        }
    };

    const handleDeleteCourse = async (id: number) => {
        const originalCourses = [...courses];
        const originalTotal = totalCount;

        setCourses(prev => {
            const remaining = prev.filter(c => c.id !== id);
            if (remaining.length === 0 && query.page > 1)
                setQuery(q => ({ ...q, page: q.page - 1 }));
            return remaining;
        });
        setTotalCount(prev => Math.max(0, prev - 1));
        setDeletingCourse(null);

        try {
            await courseService.deleteCourses([String(id)]);
            showToast.success("Xóa khóa học thành công");
        } catch (err) {
            console.error('Delete failed', err);
            showToast.error('Xóa thất bại, đang hoàn tác...');
            setCourses(originalCourses);
            setTotalCount(originalTotal);
        }
    };

    const handleUpdateCourse = async (id: number, data: CourseRequest) => {
        try {
            const updated = await courseService.updateCourse(id, data);
            setCourses(prev => prev.map(c => c.id === id ? mapCourseToUI(updated) : c));
            showToast.success("Cập nhật khóa học thành công");
            setEditingCourse(null);
            return updated;
        } catch (err: any) {
            if (err?.response?.status === 400) throw err;
            showToast.error(err?.response?.data?.message || "Cập nhật thất bại");
            throw err;
        }
    };

    /* ── Pagination controls update query.page ── */
    const goToPrevPage = () => setQuery(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }));
    const goToNextPage = () => setQuery(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }));

    const openLessons = (id: number, title?: string) => {
        // Navigate to lesson page under management, pass course title via location state
        navigate(`/management/courses/${id}/lessons`, { state: { courseTitle: title } });
    };

    return (
        <main className="min-h-screen bg-ink-50 relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6 sm:mb-8 animate-fade-in-up">
                    <section>
                        <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                            <span className="text-ink-400">~/</span>
                            <span>management</span>
                            <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900">Quản lý khóa học</h1>
                    </section>
                    <button
                        onClick={() => setShowAddCourseModal(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Plus size={18} /> Thêm khóa học
                    </button>
                </div>

                {/* FILTERS */}
                <div className="mb-6 p-3 sm:p-4 bg-white border border-ink-200 rounded-2xl shadow-soft">
                    <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                        <div className="flex-1 min-w-[140px] sm:max-w-[200px] relative">
                            <label className="block text-sm font-semibold text-ink-700 mb-2">Tìm kiếm</label>
                            <Search className="absolute left-3 top-[38px] text-ink-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, mô tả..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-ink-200 rounded-lg text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/30 transition-all"
                            />
                        </div>

                        <div className="w-full sm:w-44">
                            <CustomDropdown
                                label="Cấp độ"
                                value={query.level}
                                onChange={(val) => handleFilterChange('level', val)}
                                options={[
                                    { value: '', label: 'Tất cả', icon: List },
                                    { value: 'Beginner', label: 'Beginner', icon: Leaf, iconClass: 'text-green-500' },
                                    { value: 'Intermediate', label: 'Intermediate', icon: TrendingUp, iconClass: 'text-yellow-500' },
                                    { value: 'Advanced', label: 'Advanced', icon: Flame, iconClass: 'text-red-500' },
                                ]}
                            />
                        </div>

                        <div className="w-full sm:w-44">
                            <CustomDropdown
                                label="Giá"
                                value={query.price}
                                onChange={(val) => handleFilterChange('price', val)}
                                options={[
                                    { value: '', label: 'Tất cả', icon: List },
                                    { value: 'free', label: 'Free', icon: Gift, iconClass: 'text-green-500' },
                                    { value: 'paid', label: 'Paid', icon: DollarSign, iconClass: 'text-amber-500' },
                                ]}
                            />
                        </div>

                        <button
                            onClick={handleResetFilters}
                            className="px-4 py-2 text-sm font-semibold text-ink-700 bg-ink-100 border border-ink-200 rounded-lg hover:bg-ink-200 transition-colors"
                        >
                            Reset
                        </button>

                        {(query.search || query.level || query.price) && (
                            <div className="ml-auto text-sm text-ink-600">
                                <span className="font-semibold">{totalCount}</span> kết quả
                            </div>
                        )}
                    </div>
                </div>

                {error ? (
                    <div className="p-12 text-center bg-white border-2 border-dashed border-ink-300 rounded-3xl shadow-soft">
                        <p className="text-rose-600 text-lg font-medium">{error}</p>
                        <button
                            onClick={() => setQuery({...query})}
                            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : (
                    <>
                        {/* RESULTS INFO */}
                        <div className="mb-4 text-sm text-ink-600 flex justify-between items-center">
                            <div>
                                Hiển thị <span className="font-semibold text-ink-900">{courses.length > 0 ? ((query.page - 1) * ITEMS_PER_PAGE) + 1 : 0}</span> đến <span className="font-semibold text-ink-900">{Math.min(query.page * ITEMS_PER_PAGE, totalCount)}</span> trong <span className="font-semibold text-ink-900">{totalCount}</span> khóa học
                            </div>
                            {loading && (
                                <div className="flex items-center gap-2 text-primary-600 text-xs font-semibold animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" />
                                    ĐANG CẬP NHẬT...
                                </div>
                            )}
                        </div>

                        {/* LIST */}
                        <div className={`transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                            {courses.length > 0 ? (
                                courses.map(course => (
                                    <CourseListItem key={course.id} course={course} onClick={() => openLessons(course.id, course.title)} onDelete={(id) => setDeletingCourse(courses.find(c => c.id === id) ?? null)} onEdit={setEditingCourse} />
                                ))
                            ) : (
                                !loading && (
                                    <div className="text-center py-12 bg-white border-2 border-dashed border-ink-300 rounded-3xl shadow-soft">
                                        <p className="text-ink-500 text-lg">Không có khóa học nào được tìm thấy</p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* PAGINATION */}
                        {totalCount > ITEMS_PER_PAGE && (
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink-200">
                                <div className="text-sm text-ink-600">
                                    Trang <span className="font-semibold text-ink-900">{query.page}</span> / <span className="font-semibold text-ink-900">{totalPages}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={goToPrevPage}
                                        disabled={query.page === 1 || loading}
                                        className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="Previous page"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={goToNextPage}
                                        disabled={query.page === totalPages || loading}
                                        className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title="Next page"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AddCourseDialog
                open={showAddCourseModal}
                onClose={() => setShowAddCourseModal(false)}
                onSubmit={handleAddCourse}
            />

            <EditCourseDialog
                open={editingCourse !== null}
                course={editingCourse}
                onClose={() => setEditingCourse(null)}
                onSubmit={handleUpdateCourse}
            />

            <DeleteCourseDialog
                course={deletingCourse}
                onClose={() => setDeletingCourse(null)}
                onConfirm={handleDeleteCourse}
            />
        </main>
    );
};

export default CourseManagement;

