import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import type { Framework, FrameworkRequest } from "../../../types/framework";
import frameworkService from "../../../services/frameworkService";
import { showToast } from "../../../components/CustomToast";
import FrameworkListItem from './FrameworkListItem';
import FrameworkDialog from './FrameworkDialog';

const FrameworkManagement: React.FC = () => {
    const [frameworks, setFrameworks] = useState<Framework[]>([]);
    const [filtered, setFiltered] = useState<Framework[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [modal, setModal] = useState<{ open: boolean; framework: Framework | null }>({ open: false, framework: null });

    const PAGE_SIZE = 10;

    const fetchFrameworks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await frameworkService.getFrameworks();
            setFrameworks(data);
        } catch {
            showToast.error("Không thể tải danh sách framework");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFrameworks(); }, [fetchFrameworks]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        setFiltered(q ? frameworks.filter(f => f.name.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q)) : frameworks);
    }, [frameworks, searchQuery]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handleCreateOrUpdate = async (data: FrameworkRequest) => {
        try {
            if (modal.framework) {
                const updated = await frameworkService.updateFramework(modal.framework.id, data);
                setFrameworks(prev => prev.map(f => f.id === updated.id ? updated : f));
                showToast.success("Cập nhật framework thành công");
            } else {
                const created = await frameworkService.createFramework(data);
                setFrameworks(prev => [created, ...prev]);
                showToast.success("Thêm framework thành công");
            }
        } catch (err: any) {
            showToast.error(err.response?.data?.message || "Thao tác thất bại");
            throw err;
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa framework này?")) return;
        try {
            await frameworkService.deleteFramework(id);
            setFrameworks(prev => prev.filter(f => f.id !== id));
            showToast.success("Xóa framework thành công");
        } catch {
            showToast.error("Xóa thất bại");
        }
    };

    return (
        <main className="min-h-screen bg-ink-50 relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6 sm:mb-8 animate-fade-in-up">
                    <section>
                        <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                            <span className="text-ink-400">~/</span>
                            <span>management</span>
                            <span className="text-ink-400">/</span>
                            <span>frameworks</span>
                            <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900">Quản lý Framework</h1>
                        <p className="text-ink-500 mt-1 text-sm">Framework và thư viện dùng trong các khóa học</p>
                    </section>
                    <button
                        onClick={() => setModal({ open: true, framework: null })}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-accent-600 to-primary-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Plus size={18} /> Thêm framework
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6 p-3 sm:p-4 bg-white border border-ink-200 rounded-2xl shadow-soft">
                    <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                        <div className="flex-1 min-w-[140px] relative">
                            <label className="block text-sm font-semibold text-ink-700 mb-2">Tìm kiếm</label>
                            <Search className="absolute left-3 top-[38px] text-ink-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc slug..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-ink-200 rounded-lg text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/30 transition-all"
                            />
                        </div>
                        {searchQuery && (
                            <div className="ml-auto text-sm text-ink-600 self-end pb-2">
                                <span className="font-semibold">{filtered.length}</span> kết quả
                            </div>
                        )}
                    </div>
                </div>

                {/* Count */}
                <div className="mb-4 text-sm text-ink-600 flex justify-between items-center">
                    <div>
                        Hiển thị <span className="font-semibold text-ink-900">{paginated.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span> đến <span className="font-semibold text-ink-900">{Math.min(page * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-ink-900">{filtered.length}</span> framework
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
                        <div className="space-y-0">
                            {paginated.map(fw => (
                                <FrameworkListItem
                                    key={fw.id}
                                    framework={fw}
                                    onEdit={(f) => setModal({ open: true, framework: f })}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        !loading && (
                            <div className="text-center py-12 bg-white border-2 border-dashed border-ink-300 rounded-3xl shadow-soft">
                                <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Layers className="w-8 h-8 text-ink-300" />
                                </div>
                                <h3 className="text-lg font-bold text-ink-900">Không tìm thấy framework nào</h3>
                                <p className="text-ink-500 text-sm">Thử thay đổi từ khóa hoặc thêm mới</p>
                            </div>
                        )
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > PAGE_SIZE && (
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink-200">
                        <div className="text-sm text-ink-600">
                            Trang <span className="font-semibold text-ink-900">{page}</span> / <span className="font-semibold text-ink-900">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading} className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages || loading} className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <FrameworkDialog
                    open={modal.open}
                    framework={modal.framework}
                    onClose={() => setModal({ open: false, framework: null })}
                    onSubmit={handleCreateOrUpdate}
                />
            </div>
        </main>
    );
};

export default FrameworkManagement;
