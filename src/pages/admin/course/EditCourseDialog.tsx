import React, { useState, useEffect, useRef } from "react";
import { showToast } from "../../../components/CustomToast";
import { CourseRequest, CourseUI, Level, LEVEL_LABEL_TO_NUMBER } from "../../../types/course";
import type { Language } from "../../../types/language";
import type { Framework } from "../../../types/framework";
import languageService from "../../../services/languageService";
import frameworkService from "../../../services/frameworkService";
import CustomDropdown from "../../../components/CustomDropdown";
import CustomCheckbox from "../../../components/CustomCheckbox";
import { LevelOptions, StatusOptions } from "../../../types/dropdownOptions";
import { Loader2, X, BookOpen, Image as ImageIcon, Coins, Sparkles, AlertCircle, Code2, Layers } from "lucide-react";

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
        languageIds: [],
        frameworkIds: [],
    });
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [availableFrameworks, setAvailableFrameworks] = useState<Framework[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const titleRef = useRef<HTMLInputElement | null>(null);
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const imageRef = useRef<HTMLInputElement | null>(null);
    const priceRef = useRef<HTMLInputElement | null>(null);

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
                languageIds: course.languages?.map(l => l.id) || [],
                frameworkIds: course.frameworks?.map(f => f.id) || [],
            });
            setErrors({});
            languageService.getLanguages().then(setAvailableLanguages).catch(() => {});
            frameworkService.getFrameworks().then(setAvailableFrameworks).catch(() => {});
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
            const map: Record<string, any> = { title: titleRef.current, description: descriptionRef.current, imageUrl: imageRef.current, price: priceRef.current };
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

    const toggleLanguage = (id: number) => {
        setForm(prev => {
            const ids = prev.languageIds || [];
            return { ...prev, languageIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] };
        });
    };

    const toggleFramework = (id: number) => {
        setForm(prev => {
            const ids = prev.frameworkIds || [];
            return { ...prev, frameworkIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] };
        });
    };

    const inputBase = "w-full bg-white text-ink-900 placeholder:text-ink-400 border rounded-xl px-3 py-2.5 text-sm transition-all outline-none";
    const inputValid = "border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15";
    const inputError = "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-300/20";

    const renderSelectList = (
        items: { id: number; name: string; iconUrl?: string | null }[],
        selectedIds: number[],
        onToggle: (id: number) => void,
        accentColor: 'primary' | 'accent'
    ) => {
        const cls = accentColor === 'accent'
            ? { bg: 'bg-accent-50', border: 'border-accent-300', text: 'text-accent-700', check: 'bg-accent-600 border-accent-600', imgBorder: 'border-accent-200' }
            : { bg: 'bg-primary-50', border: 'border-primary-300', text: 'text-primary-700', check: 'bg-primary-600 border-primary-600', imgBorder: 'border-primary-200' };

        return items.map(item => {
            const selected = selectedIds.includes(item.id);
            return (
                <div
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${selected ? `${cls.bg} ${cls.border} shadow-sm` : 'bg-white border-ink-100 hover:border-ink-300 hover:bg-ink-50'}`}
                >
                    <div className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden border ${selected ? `${cls.imgBorder} bg-white` : 'border-ink-100 bg-ink-50'}`}>
                        {item.iconUrl
                            ? <img src={item.iconUrl} alt={item.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                            : <span className="text-[9px] font-black text-ink-400">{item.name.slice(0,2).toUpperCase()}</span>
                        }
                    </div>
                    <span className={`text-sm font-semibold flex-1 truncate ${selected ? cls.text : 'text-ink-700'}`}>{item.name}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${selected ? cls.check : 'border-ink-300 bg-white'}`}>
                        {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                </div>
            );
        });
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
                                <h2 id="edit-course-title" className="text-lg font-bold text-ink-900">Chỉnh sửa khóa học</h2>
                                <p className="text-xs text-ink-500 font-mono truncate max-w-[220px]">{course.title}</p>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-white/60 transition-colors">
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
                        <input ref={titleRef} placeholder="vd: React.js từ cơ bản đến nâng cao" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); clearError("title"); }} className={`${inputBase} ${errors.title ? inputError : inputValid}`} />
                        {errors.title && <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.title}</p>}
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="block text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide">Mô tả ngắn</label>
                        <textarea ref={descriptionRef} placeholder="Nội dung khóa học sẽ dạy gì?" value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); clearError("description"); }} className={`${inputBase} min-h-[80px] resize-y ${errors.description ? inputError : inputValid}`} />
                        {errors.description && <p className="text-rose-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.description}</p>}
                    </div>

                    {/* IMAGE + PRICE */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1"><ImageIcon size={11} /> Ảnh URL</label>
                            <input ref={imageRef} placeholder="https://..." value={form.imageUrl ?? ""} onChange={(e) => { setForm({ ...form, imageUrl: e.target.value || null }); clearError("imageUrl"); }} className={`${inputBase} font-mono text-xs ${errors.imageUrl ? inputError : inputValid}`} />
                            {errors.imageUrl && <p className="text-rose-600 text-xs mt-1">{errors.imageUrl}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1"><Coins size={11} /> Giá tiền</label>
                            <input ref={priceRef} type="text" value={form.price === 0 ? "" : formatCurrency(form.price)} onChange={(e) => { const raw = e.target.value.replace(/[^\d]/g, ""); setForm({ ...form, price: raw === "" ? 0 : Number(raw) }); clearError("price"); }} placeholder="0 (Free)" className={`${inputBase} font-mono ${errors.price ? inputError : inputValid}`} />
                            {errors.price && <p className="text-rose-600 text-xs mt-1">{errors.price}</p>}
                        </div>
                    </div>

                    {/* LEVEL + STATUS */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <CustomDropdown label="Cấp độ" value={(form.level ?? "") as unknown as string} onChange={(val) => { if (!val) setForm({ ...form, level: 0 }); else setForm({ ...form, level: val as unknown as Level }); clearError("level"); }} options={LevelOptions} placeholder="Chọn cấp độ" error={errors.level} />
                            {errors.level && <p className="text-rose-600 text-xs mt-1">{errors.level}</p>}
                        </div>
                        <div>
                            <CustomDropdown label="Trạng thái" value={String(form.isActive) as unknown as string} onChange={(val) => { setForm({ ...form, isActive: val === "" ? true : val === "true" }); clearError("isActive"); }} options={StatusOptions} placeholder="Chọn trạng thái" error={errors.isActive} />
                            {errors.isActive && <p className="text-rose-600 text-xs mt-1">{errors.isActive}</p>}
                        </div>
                    </div>

                    {/* Featured */}
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/40 border border-amber-200">
                        <CustomCheckbox checked={form.isFeatured} onChange={(checked) => setForm({ ...form, isFeatured: checked })} label="Đánh dấu Featured" />
                        <p className="text-[11px] text-ink-500 mt-1 ml-7 flex items-center gap-1">
                            <Sparkles size={10} className="text-amber-500" />
                            Khóa học sẽ được hiển thị nổi bật trên trang chủ
                        </p>
                    </div>

                    {/* LANGUAGES */}
                    {availableLanguages.length > 0 && (
                        <div className="pt-1">
                            <label className="text-xs font-semibold text-ink-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                <Code2 size={11} /> Ngôn ngữ
                                {(form.languageIds?.length ?? 0) > 0 && (
                                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-600">
                                        {form.languageIds?.length} đã chọn
                                    </span>
                                )}
                            </label>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                                {renderSelectList(availableLanguages, form.languageIds || [], toggleLanguage, 'primary')}
                            </div>
                        </div>
                    )}

                    {/* FRAMEWORKS */}
                    {availableFrameworks.length > 0 && (
                        <div className="pt-1">
                            <label className="text-xs font-semibold text-ink-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                <Layers size={11} /> Framework
                                {(form.frameworkIds?.length ?? 0) > 0 && (
                                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-100 text-accent-600">
                                        {form.frameworkIds?.length} đã chọn
                                    </span>
                                )}
                            </label>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                                {renderSelectList(availableFrameworks, form.frameworkIds || [], toggleFramework, 'accent')}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 px-5 py-4 border-t border-ink-200 bg-ink-50/50">
                    <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-ink-700 bg-white border border-ink-300 rounded-xl hover:bg-ink-50 transition-colors disabled:opacity-50">
                        Hủy
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-semibold rounded-xl shadow-glow-primary hover:shadow-glow-accent active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all">
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
