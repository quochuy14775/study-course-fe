import React, { useState, useEffect, useRef } from "react";
import { showToast } from "../../../components/CustomToast";
import { CourseRequest, Level } from "../../../types/course";
import CustomDropdown from "../../../components/CustomDropdown";
import CustomCheckbox from "../../../components/CustomCheckbox";
import { LevelOptions, StatusOptions } from "../../../types/dropdownOptions";
import { Loader2, X, BookPlus, Image as ImageIcon, Coins, Sparkles, AlertCircle } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CourseRequest) => Promise<any>;
}

const formatCurrency = (value: number) => `${value.toLocaleString("en-US")} ₫`;

const AddCourseDialog: React.FC<Props> = ({ open, onClose, onSubmit }) => {
    const [form, setForm] = useState<CourseRequest>({
        title: "",
        description: "",
        imageUrl: null,
        price: 0,
        level: 0,
        isFeatured: false,
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const titleRef = useRef<HTMLInputElement | null>(null);
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const imageRef = useRef<HTMLInputElement | null>(null);
    const priceRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setForm({
                title: "",
                description: "",
                imageUrl: null,
                price: 0,
                level: 0,
                isFeatured: false,
                isActive: true,
            });
            setErrors({});
        }
    }, [open]);

    if (!open) return null;

    const clearError = (key: string) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const focusFirstError = (errs: Record<string, string>) => {
        const keys = Object.keys(errs);
        if (!keys.length) return;
        const first = keys[0];
        setTimeout(() => {
            const map: Record<string, any> = {
                title: titleRef.current,
                description: descriptionRef.current,
                imageUrl: imageRef.current,
                price: priceRef.current,
            };
            const el = map[first];
            if (el?.focus) {
                el.focus();
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 50);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setErrors({});
            await onSubmit(form);
        } catch (err: any) {
            const apiErrors = err?.response?.data?.errors;
            if (err?.response?.status === 400 && apiErrors && typeof apiErrors === "object") {
                setErrors(apiErrors);
                focusFirstError(apiErrors);
                return;
            }
            showToast.error(err?.response?.data?.message || "Tạo khóa học thất bại");
        } finally {
            setLoading(false);
        }
    };

    const inputBase = "w-full bg-white text-ink-900 placeholder:text-ink-400 border rounded-xl px-3 py-2.5 text-sm transition-all outline-none";
    const inputValid = "border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15";
    const inputError = "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-300/20";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-course-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-white border border-ink-200 rounded-3xl shadow-soft-lg overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-5 py-4 border-b border-ink-200 bg-gradient-to-br from-primary-50/60 to-accent-50/60">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-glow-primary">
                                <BookPlus className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 id="add-course-title" className="text-lg font-bold text-ink-900">
                                    Thêm khóa học mới
                                </h2>
                                <p className="text-xs text-ink-500 font-mono">Tạo xong sẽ vào curriculum builder</p>
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
                                    const rawValue = e.target.value.replace(/[^\d]/g, "");
                                    setForm({ ...form, price: rawValue === "" ? 0 : Number(rawValue) });
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
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <BookPlus size={16} />
                                Tạo khóa học
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCourseDialog;

