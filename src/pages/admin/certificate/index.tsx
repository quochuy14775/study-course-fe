import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Award, Trash2, GraduationCap, Copy } from 'lucide-react';
import type { CertificateAdmin } from '../../../types/certificate';
import type { Course } from '../../../types/course';
import certificateService from '../../../services/certificateService';
import courseService from '../../../services/courseServices';
import { showToast } from '../../../components/CustomToast';

const PAGE_SIZE = 10;

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const CertificateManagement: React.FC = () => {
    const [certificates, setCertificates] = useState<CertificateAdmin[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [courseFilter, setCourseFilter] = useState<number | ''>('');

    const fetchCertificates = useCallback(async () => {
        try {
            setLoading(true);
            const data = await certificateService.getCertificates({
                courseId: courseFilter === '' ? undefined : courseFilter,
                search: searchQuery || undefined,
            });
            setCertificates(data);
        } catch {
            showToast.error('Không thể tải danh sách chứng chỉ');
        } finally {
            setLoading(false);
        }
    }, [courseFilter, searchQuery]);

    useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

    useEffect(() => {
        courseService.getCourses()
            .then((res) => setCourses(res.value ?? []))
            .catch(() => { /* filter khóa học là tùy chọn — không chặn trang nếu lỗi */ });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const paginated = certificates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(certificates.length / PAGE_SIZE);

    const handleRevoke = async (cert: CertificateAdmin) => {
        if (!window.confirm(
            `Thu hồi chứng chỉ ${cert.certificateCode} của ${cert.userName}?\n\n` +
            'Học viên sẽ mất quyền xem chứng chỉ này. Nếu họ làm lại và đạt bài test cuối khóa, hệ thống sẽ cấp lại chứng chỉ mới.'
        )) return;

        try {
            await certificateService.revokeCertificate(cert.id);
            setCertificates((prev) => prev.filter((c) => c.id !== cert.id));
            showToast.success('Đã thu hồi chứng chỉ');
        } catch {
            showToast.error('Thu hồi thất bại');
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
            .then(() => showToast.success('Đã sao chép mã chứng chỉ'))
            .catch(() => showToast.error('Không sao chép được'));
    };

    return (
        <main className="min-h-screen bg-ink-50 relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* Header */}
                <div className="mb-6 sm:mb-8 animate-fade-in-up">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                        <span className="text-ink-400">~/</span>
                        <span>management</span>
                        <span className="text-ink-400">/</span>
                        <span>certificates</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900">Quản lý chứng chỉ</h1>
                    <p className="text-ink-500 mt-1 text-sm">
                        Chứng chỉ được cấp tự động khi học viên đạt bài test cuối khóa — admin chỉ theo dõi và thu hồi khi cần
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6 p-3 sm:p-4 bg-white border border-ink-200 rounded-2xl shadow-soft">
                    <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                        <div className="flex-1 min-w-[180px] relative">
                            <label className="block text-sm font-semibold text-ink-700 mb-2">Tìm kiếm</label>
                            <Search className="absolute left-3 top-[38px] text-ink-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tên học viên, email hoặc mã chứng chỉ..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-ink-200 rounded-lg text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/30 transition-all"
                            />
                        </div>
                        <div className="min-w-[180px]">
                            <label className="block text-sm font-semibold text-ink-700 mb-2">Khóa học</label>
                            <select
                                value={courseFilter}
                                onChange={(e) => { setCourseFilter(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
                                className="w-full px-3 py-2 bg-white border border-ink-200 rounded-lg text-ink-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/30 transition-all"
                            >
                                <option value="">Tất cả khóa học</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Count */}
                <div className="mb-4 text-sm text-ink-600 flex justify-between items-center">
                    <div>
                        Hiển thị <span className="font-semibold text-ink-900">{paginated.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span> đến{' '}
                        <span className="font-semibold text-ink-900">{Math.min(page * PAGE_SIZE, certificates.length)}</span> trong{' '}
                        <span className="font-semibold text-ink-900">{certificates.length}</span> chứng chỉ
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-primary-600 text-xs font-semibold animate-pulse">
                            <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" />
                            ĐANG CẬP NHẬT...
                        </div>
                    )}
                </div>

                {/* List */}
                <div className={`transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {paginated.length > 0 ? (
                        <div className="space-y-2">
                            {paginated.map((cert) => (
                                <div
                                    key={cert.id}
                                    className="group flex items-center gap-3 px-4 py-3 bg-white border border-ink-200 rounded-xl hover:border-amber-300 hover:shadow-soft transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                                        <Award size={18} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-ink-900 truncate">{cert.userName}</p>
                                            {cert.userEmail && (
                                                <span className="text-xs text-ink-400 truncate">{cert.userEmail}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-ink-500 truncate mt-0.5">{cert.courseTitle}</p>
                                    </div>

                                    <div className="hidden sm:flex flex-col items-end flex-shrink-0 gap-0.5">
                                        <button
                                            onClick={() => copyCode(cert.certificateCode)}
                                            title="Sao chép mã chứng chỉ"
                                            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-ink-700 hover:text-primary-600 transition-colors"
                                        >
                                            {cert.certificateCode}
                                            <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <span className="text-[11px] text-ink-400">{formatDate(cert.issuedAt)}</span>
                                    </div>

                                    <span className="px-2.5 py-1 rounded-lg bg-code-50 text-code-700 text-xs font-bold font-mono flex-shrink-0">
                                        {cert.scorePercentage}%
                                    </span>

                                    <button
                                        onClick={() => handleRevoke(cert)}
                                        title="Thu hồi chứng chỉ"
                                        className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !loading && (
                            <div className="text-center py-12 bg-white border-2 border-dashed border-ink-300 rounded-3xl shadow-soft">
                                <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <GraduationCap className="w-8 h-8 text-ink-300" />
                                </div>
                                <h3 className="text-lg font-bold text-ink-900">Chưa có chứng chỉ nào</h3>
                                <p className="text-ink-500 text-sm">
                                    {searchQuery || courseFilter !== ''
                                        ? 'Thử thay đổi bộ lọc hoặc từ khóa'
                                        : 'Chứng chỉ sẽ xuất hiện khi học viên đạt bài test cuối khóa'}
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Pagination */}
                {certificates.length > PAGE_SIZE && (
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink-200">
                        <div className="text-sm text-ink-600">
                            Trang <span className="font-semibold text-ink-900">{page}</span> / <span className="font-semibold text-ink-900">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 1 || loading}
                                className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page === totalPages || loading}
                                className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default CertificateManagement;
