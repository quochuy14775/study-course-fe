import React, { useState, useEffect, useRef } from "react";
import { showToast } from "../../../components/CustomToast";
import { CourseRequest, CourseUI, Level, LEVEL_LABEL_TO_NUMBER } from "../../../types/course";
import CustomDropdown from "../../../components/CustomDropdown";
import CustomCheckbox from "../../../components/CustomCheckbox";
import { LevelOptions, StatusOptions } from "../../../types/dropdownOptions";
import { Loader2, X, BookOpen, Image as ImageIcon, Coins, Sparkles, AlertCircle } from "lucide-react";
import { Skill, SkillListResponse } from "../../../types/skill";
import courseService from "../../../services/courseServices";

interface Props {
    open: boolean;
    course: CourseUI | null;
    onClose: () => void;
    onSubmit: (id: number, data: CourseRequest) => Promise<any>;
}

const formatCurrency = (value: number) => `${value.toLocaleString("en-US")} ₫`;

const EditCourseDialog: React.FC<Props> = ({ open, course, onClose, onSubmit }) => {
    const [form, setForm] = useState<CourseRequest>({
        title: "",
        description: "",
        imageUrl: null,
        price: 0,
        level: 0,
        isFeatured: false,
        isActive: true,
        skills: []
    });
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [skillSearch, setSkillSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const titleRef = useRef<HTMLInputElement | null>(null);
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const imageRef = useRef<HTMLInputElement | null>(null);
    const priceRef = useRef<HTMLInputElement | null>(null);

    // Pre-fill form khi mở dialog với course data
    useEffect(() => {
        if (open && course) {
            setForm({
                title: course.title,
                description: course.description ?? "",
                imageUrl: course.imageUrl ?? null,
                price: course.price,
                level: LEVEL_LABEL_TO_NUMBER[course.level] ?? 0,
                isFeatured: course.isFeatured,
                isActive: course.isActive,
                skills: course.courseSkills?.map(cs => ({
                    skillId: cs.skillId,
                    contributionPercentage: cs.contributionPercentage
                })) || []
            });
            setErrors({});
            // Load available skills
            courseService.getSkills().then((res: SkillListResponse) => setAvailableSkills(res.value));
        }
    }, [open, course]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open || !course) return null;

    const clearError = (key: string) => {
        setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    };

    const focusFirstError = (errs: Record<string, string>) => {
        const keys = Object.keys(errs);
        if (!keys.length) return;
        setTimeout(() => {
            const map: Record<string, any> = {
                title: titleRef.current,
                description: descriptionRef.current,
                imageUrl: imageRef.current,
                price: priceRef.current,
            };
            const el = map[keys[0]];
            if (el?.focus) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
        }, 50);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setErrors({});
            await onSubmit(course.id, form);
        } catch (err: any) {
            const apiErrors = err?.response?.data?.errors;
            if (err?.response?.status === 400 && apiErrors && typeof apiErrors === "object") {
                setErrors(apiErrors);
                focusFirstError(apiErrors);
                return;
            }
            showToast.error(err?.response?.data?.message || "Cập nhật khóa học thất bại");
        } finally {
            setLoading(false);
        }
    };

    const inputBase = "w-full bg-white text-ink-900 placeholder:text-ink-400 border rounded-xl px-3 py-2.5 text-sm transition-all outline-none";
    const inputValid = "border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15";
    const inputError = "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-300/20";

    const handleSkillToggle = (skillId: number) => {
        setForm(prev => {
            const exists = prev.skills?.find(s => s.skillId === skillId);
            if (exists) {
                return { ...prev, skills: prev.skills?.filter(s => s.skillId !== skillId) };
            } else {
                return { ...prev, skills: [...(prev.skills || []), { skillId, contributionPercentage: 10 }] };
            }
        });
    };

    const handleWeightChange = (skillId: number, weight: number) => {
        setForm(prev => ({
            ...prev,
            skills: prev.skills?.map(s => s.skillId === skillId ? { ...s, contributionPercentage: weight } : s)
        }));
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-course-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />

            <div className="relative w-full max-w-md bg-white border border-ink-200 rounded-3xl shadow-soft-lg overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-5 py-4 border-b border-ink-200 bg-gradient-to-br from-primary-50/60 to-accent-50/60">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-glow-primary">
                                <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 id="edit-course-title" className="text-lg font-bold text-ink-900">
                                    Chỉnh sửa khóa học
                                </h2>
                                <p className="text-xs text-ink-500 font-mono truncate max-w-[220px]">{course.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-white/60 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 max-h-[70vh] overflow-y-auto space-y-4">
                    {/* TITLE */}
                    <div>
                        <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            Tên khóa học <span className="text-rose-500">*</span>
                        </label>
                        <input
                            ref={titleRef}
                            placeholder="vd: React.js từ cơ bản đến nâng cao"
                            value={form.title}
                            onChange={(e) => { setForm({ ...form, title: e.target.value }); clearError("title"); }}
                            className={`${inputBase} ${errors.title ? inputError : inputValid}`}
                        />
                        {errors.title && (
                            <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.title}
                            </p>
                        )}
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="block text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide">
                            Mô tả ngắn
                        </label>
                        <textarea
                            ref={descriptionRef}
                            placeholder="Nội dung khóa học sẽ dạy gì?"
                            value={form.description}
                            onChange={(e) => { setForm({ ...form, description: e.target.value }); clearError("description"); }}
                            className={`${inputBase} min-h-[80px] resize-y ${errors.description ? inputError : inputValid}`}
                        />
                        {errors.description && (
                            <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.description}
                            </p>
                        )}
                    </div>

                    {/* IMAGE + PRICE */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                                <ImageIcon size={11} /> Ảnh URL
                            </label>
                            <input
                                ref={imageRef}
                                placeholder="https://..."
                                value={form.imageUrl ?? ""}
                                onChange={(e) => { setForm({ ...form, imageUrl: e.target.value || null }); clearError("imageUrl"); }}
                                className={`${inputBase} font-mono text-xs ${errors.imageUrl ? inputError : inputValid}`}
                            />
                            {errors.imageUrl && <p className="text-rose-600 text-xs mt-1">{errors.imageUrl}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                                <Coins size={11} /> Giá tiền
                            </label>
                            <input
                                ref={priceRef}
                                type="text"
                                value={form.price === 0 ? "" : formatCurrency(form.price)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^\d]/g, "");
                                    setForm({ ...form, price: raw === "" ? 0 : Number(raw) });
                                    clearError("price");
                                }}
                                placeholder="0 (Free)"
                                className={`${inputBase} font-mono ${errors.price ? inputError : inputValid}`}
                            />
                            {errors.price && <p className="text-rose-600 text-xs mt-1">{errors.price}</p>}
                        </div>
                    </div>

                    {/* LEVEL + STATUS */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomDropdown
                                label="Cấp độ"
                                value={(form.level ?? "") as unknown as string}
                                onChange={(val) => {
                                    if (!val) setForm({ ...form, level: 0 });
                                    else setForm({ ...form, level: val as unknown as Level });
                                    clearError("level");
                                }}
                                options={LevelOptions}
                                placeholder="Chọn cấp độ"
                                error={errors.level}
                            />
                            {errors.level && <p className="text-rose-600 text-xs mt-1">{errors.level}</p>}
                        </div>

                        <div>
                            <CustomDropdown
                                label="Trạng thái"
                                value={String(form.isActive) as unknown as string}
                                onChange={(val) => {
                                    setForm({ ...form, isActive: val === "" ? true : val === "true" });
                                    clearError("isActive");
                                }}
                                options={StatusOptions}
                                placeholder="Chọn trạng thái"
                                error={errors.isActive}
                            />
                            {errors.isActive && <p className="text-rose-600 text-xs mt-1">{errors.isActive}</p>}
                        </div>
                    </div>

                    {/* Featured */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/40 border border-amber-200">
                        <CustomCheckbox
                            checked={form.isFeatured}
                            onChange={(checked) => setForm({ ...form, isFeatured: checked })}
                            label={"Đánh dấu Featured"}
                        />
                        <p className="text-[11px] text-ink-500 mt-1 ml-7 flex items-center gap-1">
                            <Sparkles size={10} className="text-amber-500" />
                            Khóa học sẽ được hiển thị nổi bật trên trang chủ
                        </p>
                    </div>

                    {/* SKILLS */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-ink-700 uppercase tracking-wide">
                                Kỹ năng cung cấp
                            </label>
                            {(form.skills?.length ?? 0) > 0 && (() => {
                                const total = form.skills?.reduce((sum, s) => sum + s.contributionPercentage, 0) ?? 0;
                                const isOver = total > 100;
                                return (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOver ? 'bg-rose-100 text-rose-600' : total === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-100 text-primary-600'}`}>
                                        Tổng: {total}%
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Search skills */}
                        {availableSkills.length > 5 && (
                            <div className="mb-2">
                                <input
                                    type="text"
                                    placeholder="Tìm kỹ năng..."
                                    value={skillSearch}
                                    onChange={(e) => setSkillSearch(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-ink-200 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-300/30 transition-all"
                                />
                            </div>
                        )}

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                            {availableSkills
                                .filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
                                .map(skill => {
                                    const skillConfig = form.skills?.find(s => s.skillId === skill.id);
                                    const isSelected = !!skillConfig;
                                    return (
                                        <div
                                            key={skill.id}
                                            onClick={() => handleSkillToggle(skill.id)}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                                                    : 'bg-white border-ink-100 hover:border-ink-300 hover:bg-ink-50'
                                            }`}
                                        >
                                            {/* Icon */}
                                            <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden border ${isSelected ? 'border-primary-200 bg-white' : 'border-ink-100 bg-ink-50'}`}>
                                                {skill.iconUrl
                                                    ? <img src={skill.iconUrl} alt={skill.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                                    : <span className="text-[10px] font-black text-ink-400">{skill.name.slice(0,2).toUpperCase()}</span>
                                                }
                                            </div>

                                            {/* Name */}
                                            <span className={`text-sm font-semibold flex-1 truncate ${isSelected ? 'text-primary-700' : 'text-ink-700'}`}>
                                                {skill.name}
                                            </span>

                                            {/* Checkbox indicator */}
                                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-ink-300 bg-white'}`}>
                                                {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                            </div>

                                            {/* Percentage stepper */}
                                            {isSelected && (
                                                <div
                                                    className="flex items-center gap-1 ml-1"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleWeightChange(skill.id, Math.max(1, (skillConfig?.contributionPercentage ?? 10) - 5))}
                                                        className="w-5 h-5 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700 flex items-center justify-center font-bold text-xs transition-colors"
                                                    >−</button>
                                                    <span className="w-8 text-center text-xs font-bold text-primary-700">
                                                        {skillConfig?.contributionPercentage}%
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleWeightChange(skill.id, Math.min(100, (skillConfig?.contributionPercentage ?? 10) + 5))}
                                                        className="w-5 h-5 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700 flex items-center justify-center font-bold text-xs transition-colors"
                                                    >+</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            {availableSkills.length === 0 && (
                                <div className="text-center py-6 border border-dashed border-ink-200 rounded-xl">
                                    <p className="text-xs text-ink-400">Chưa có kỹ năng nào. Hãy tạo kỹ năng trước.</p>
                                </div>
                            )}
                            {availableSkills.length > 0 && availableSkills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase())).length === 0 && (
                                <div className="text-center py-6 border border-dashed border-ink-200 rounded-xl">
                                    <p className="text-xs text-ink-400">Không tìm thấy kỹ năng nào phù hợp</p>
                                </div>
                            )}
                        </div>
                    </div>
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
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-semibold rounded-xl shadow-glow-primary hover:shadow-glow-accent active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={16} /> Đang lưu...</>
                        ) : (
                            <><BookOpen size={16} /> Lưu thay đổi</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCourseDialog;

