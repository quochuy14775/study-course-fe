import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Code2 } from 'lucide-react';
import type { Language, LanguageRequest } from "../../../types/language";
import languageService from "../../../services/languageService";
import { showToast } from "../../../components/CustomToast";
import LanguageListItem from './LanguageListItem';
import LanguageDialog from './LanguageDialog';

const LanguageManagement: React.FC = () => {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [filtered, setFiltered] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [modal, setModal] = useState<{ open: boolean; language: Language | null }>({ open: false, language: null });

    const PAGE_SIZE = 10;

    const fetchLanguages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await languageService.getLanguages();
            setLanguages(data);
        } catch {
            showToast.error("Không thể tải danh sách ngôn ngữ");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLanguages(); }, [fetchLanguages]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        setFiltered(q ? languages.filter(l => l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q)) : languages);
    }, [languages, searchQuery]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handleCreateOrUpdate = async (data: LanguageRequest) => {
        try {
            if (modal.language) {
                const updated = await languageService.updateLanguage(modal.language.id, data);
                setLanguages(prev => prev.map(l => l.id === updated.id ? updated : l));
                showToast.success("Cập nhật ngôn ngữ thành công");
            } else {
                const created = await languageService.createLanguage(data);
                setLanguages(prev => [created, ...prev]);
                showToast.success("Thêm ngôn ngữ thành công");
            }
        } catch (err: any) {
            showToast.error(err.response?.data?.message || "Thao tác thất bại");
            throw err;
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ngôn ngữ này?")) return;
        try {
            await languageService.deleteLanguage(id);
            setLanguages(prev => prev.filter(l => l.id !== id));
            showToast.success("Xóa ngôn ngữ thành công");
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
                            <span>languages</span>
                            <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900">Quản lý ngôn ngữ</h1>
                        <p className="text-ink-500 mt-1 text-sm">Ngôn ngữ lập trình dùng trong các khóa học</p>
                    </section>
                    <button
                        onClick={() => setModal({ open: true, language: null })}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Plus size={18} /> Thêm ngôn ngữ
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
                        Hiển thị <span className="font-semibold text-ink-900">{paginated.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}</span> đến <span className="font-semibold text-ink-900">{Math.min(page * PAGE_SIZE, filtered.length)}</span> trong <span className="font-semibold text-ink-900">{filtered.length}</span> ngôn ngữ
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
                            {paginated.map(lang => (
                                <LanguageListItem
                                    key={lang.id}
                                    language={lang}
                                    onEdit={(l) => setModal({ open: true, language: l })}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        !loading && (
                            <div className="text-center py-12 bg-white border-2 border-dashed border-ink-300 rounded-3xl shadow-soft">
                                <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Code2 className="w-8 h-8 text-ink-300" />
                                </div>
                                <h3 className="text-lg font-bold text-ink-900">Không tìm thấy ngôn ngữ nào</h3>
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

                <LanguageDialog
                    open={modal.open}
                    language={modal.language}
                    onClose={() => setModal({ open: false, language: null })}
                    onSubmit={handleCreateOrUpdate}
                />
            </div>
        </main>
    );
};

export default LanguageManagement;
