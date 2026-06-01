import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Box } from 'lucide-react';
import { Skill, SkillRequest } from "../../../types/skill";
import courseService from "../../../services/courseServices";
import { showToast } from "../../../components/CustomToast";
import { ITEMS_PER_PAGE } from "../../../types/odata";
import SkillListItem from './SkillListItem';
import SkillDialog from './SkillDialog';

const SkillManagement: React.FC = () => {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [modal, setModal] = useState<{ open: boolean, skill: Skill | null }>({ open: false, skill: null });

    const fetchSkills = useCallback(async () => {
        try {
            setLoading(true);
            const filter = searchQuery ? `contains(tolower(Name), '${searchQuery.toLowerCase()}')` : undefined;
            const data = await courseService.getSkills({
                count: true,
                top: ITEMS_PER_PAGE,
                skip: (page - 1) * ITEMS_PER_PAGE,
                orderby: 'CreatedAt desc',
                ...(filter && { filter })
            });
            setSkills(data.value || []);
            setTotalCount(data.count || 0);
        } catch (err) {
            showToast.error("Không thể tải danh sách kỹ năng");
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        fetchSkills();
    }, [fetchSkills]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.trim());
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleCreateOrUpdate = async (data: SkillRequest) => {
        try {
            if (modal.skill) {
                const updated = await courseService.updateSkill(modal.skill.id, data);
                setSkills(prev => prev.map(s => s.id === updated.id ? updated : s));
                showToast.success("Cập nhật kỹ năng thành công");
            } else {
                await courseService.createSkill(data);
                showToast.success("Thêm kỹ năng thành công");
                if (page === 1) fetchSkills();
                else setPage(1);
            }
        } catch (err: any) {
            showToast.error(err.response?.data?.message || "Thao tác thất bại");
            throw err;
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa kỹ năng này?")) return;
        try {
            await courseService.deleteSkill(id);
            setSkills(prev => prev.filter(s => s.id !== id));
            setTotalCount(prev => prev - 1);
            showToast.success("Xóa kỹ năng thành công");
        } catch (err) {
            showToast.error("Xóa thất bại");
        }
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
                        <span>skills</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900">Quản lý kỹ năng</h1>
                    <p className="text-ink-500 mt-1 text-sm">Định nghĩa các bộ kỹ năng cho lộ trình học tập</p>
                </section>
                <button
                    onClick={() => setModal({ open: true, skill: null })}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={18} /> Thêm kỹ năng
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 p-3 sm:p-4 bg-white border border-ink-200 rounded-2xl shadow-soft">
                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                    <div className="flex-1 min-w-[140px] relative">
                        <label className="block text-sm font-semibold text-ink-700 mb-2">Tìm kiếm</label>
                        <Search className="absolute left-3 top-[38px] text-ink-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên kỹ năng..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-white border border-ink-200 rounded-lg text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/30 transition-all"
                        />
                    </div>
                    {searchQuery && (
                        <div className="ml-auto text-sm text-ink-600 self-end pb-2">
                            <span className="font-semibold">{totalCount}</span> kết quả
                        </div>
                    )}
                </div>
            </div>

            {/* Results info */}
            <div className="mb-4 text-sm text-ink-600 flex justify-between items-center">
                <div>
                    Hiển thị <span className="font-semibold text-ink-900">{skills.length > 0 ? (page - 1) * 10 + 1 : 0}</span> đến <span className="font-semibold text-ink-900">{Math.min(page * 10, totalCount)}</span> trong <span className="font-semibold text-ink-900">{totalCount}</span> kỹ năng
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
                {skills.length > 0 ? (
                    <div className="space-y-0">
                        {skills.map(skill => (
                            <SkillListItem
                                key={skill.id}
                                skill={skill}
                                onEdit={(s: Skill) => setModal({ open: true, skill: s })}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    !loading && (
                        <div className="text-center py-12 bg-white border-2 border-dashed border-ink-300 rounded-3xl shadow-soft">
                            <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Box className="w-8 h-8 text-ink-300" />
                            </div>
                            <h3 className="text-lg font-bold text-ink-900">Không tìm thấy kỹ năng nào</h3>
                            <p className="text-ink-500 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc thêm mới</p>
                        </div>
                    )
                )}
            </div>

            {/* Pagination */}
            {totalCount > 10 && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink-200">
                    <div className="text-sm text-ink-600">
                        Trang <span className="font-semibold text-ink-900">{page}</span> / <span className="font-semibold text-ink-900">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 1 || loading}
                            className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page === totalPages || loading}
                            className="p-2 border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            <SkillDialog
                open={modal.open}
                skill={modal.skill}
                onClose={() => setModal({ open: false, skill: null })}
                onSubmit={handleCreateOrUpdate}
            />
            </div>
        </main>
    );
};

export default SkillManagement;
