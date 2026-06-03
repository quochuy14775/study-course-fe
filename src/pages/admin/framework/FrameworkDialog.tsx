import React, { useState, useEffect } from "react";
import { X, Layers, Image as ImageIcon, AlertCircle, Loader2, Code2 } from "lucide-react";
import type { Framework, FrameworkRequest } from "../../../types/framework";
import type { Language } from "../../../types/language";
import CustomCheckbox from "../../../components/CustomCheckbox";
import languageService from "../../../services/languageService";

interface Props {
    open: boolean;
    framework: Framework | null;
    onClose: () => void;
    onSubmit: (data: FrameworkRequest) => Promise<void>;
}

const toSlug = (name: string) =>
    name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const FrameworkDialog: React.FC<Props> = ({ open, framework, onClose, onSubmit }) => {
    const [form, setForm] = useState<FrameworkRequest>({
        name: "",
        slug: "",
        iconUrl: "",
        isActive: true,
        languageIds: [],
    });
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    useEffect(() => {
        if (open) {
            if (framework) {
                setForm({
                    name: framework.name,
                    slug: framework.slug,
                    iconUrl: framework.iconUrl || "",
                    isActive: framework.isActive,
                    languageIds: framework.languages?.map(l => l.id) || [],
                });
                setSlugManuallyEdited(true);
            } else {
                setForm({ name: "", slug: "", iconUrl: "", isActive: true, languageIds: [] });
                setSlugManuallyEdited(false);
            }
            setErrors({});
            languageService.getLanguages().then(setAvailableLanguages).catch(() => {});
        }
    }, [open, framework]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const handleNameChange = (name: string) => {
        setForm(prev => ({
            ...prev,
            name,
            slug: slugManuallyEdited ? prev.slug : toSlug(name),
        }));
        if (errors.name) setErrors(prev => { const n = { ...prev }; delete n.name; return n; });
    };

    const handleSlugChange = (slug: string) => {
        setSlugManuallyEdited(true);
        setForm(prev => ({ ...prev, slug }));
        if (errors.slug) setErrors(prev => { const n = { ...prev }; delete n.slug; return n; });
    };

    const toggleLanguage = (id: number) => {
        setForm(prev => {
            const ids = prev.languageIds || [];
            return {
                ...prev,
                languageIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id],
            };
        });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setErrors({});
            await onSubmit(form);
            onClose();
        } catch (err: any) {
            const apiErrors = err?.response?.data?.errors;
            if (err?.response?.status === 400 && apiErrors && typeof apiErrors === "object") {
                setErrors(apiErrors);
                return;
            }
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />

            <div className="relative w-full max-w-md bg-white border border-ink-200 rounded-3xl shadow-soft-lg overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="px-5 py-4 border-b border-ink-200 bg-gradient-to-br from-accent-50/60 to-primary-50/60">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-600 to-primary-600 flex items-center justify-center shadow-glow-primary">
                                <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-ink-900">
                                    {framework ? "Cập nhật framework" : "Thêm framework mới"}
                                </h2>
                                <p className="text-xs text-ink-500 font-mono">Framework / thư viện cho khóa học</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-white/60 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 max-h-[65vh] overflow-y-auto space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            Tên framework <span className="text-rose-500">*</span>
                        </label>
                        <input
                            placeholder="vd: React, Vue, Next.js..."
                            value={form.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className={`${inputBase} ${errors.name ? inputError : inputValid}`}
                        />
                        {errors.name && (
                            <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            Slug <span className="text-rose-500">*</span>
                        </label>
                        <input
                            placeholder="vd: react, vue, nextjs..."
                            value={form.slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            className={`${inputBase} font-mono text-xs ${errors.slug ? inputError : inputValid}`}
                        />
                        {errors.slug && (
                            <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.slug}
                            </p>
                        )}
                    </div>

                    {/* Icon URL */}
                    <div>
                        <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            <ImageIcon size={11} /> Icon URL
                        </label>
                        <input
                            placeholder="https://..."
                            value={form.iconUrl || ""}
                            onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                            className={`${inputBase} font-mono text-xs border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15`}
                        />
                    </div>

                    {/* Active */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-ink-100">
                        <CustomCheckbox
                            checked={form.isActive}
                            onChange={(checked) => setForm({ ...form, isActive: checked })}
                            label="Đang hoạt động"
                        />
                    </div>

                    {/* Languages */}
                    {availableLanguages.length > 0 && (
                        <div className="pt-1">
                            <label className="text-xs font-semibold text-ink-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                                <Code2 size={11} /> Ngôn ngữ hỗ trợ
                            </label>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                                {availableLanguages.map(lang => {
                                    const selected = form.languageIds?.includes(lang.id);
                                    return (
                                        <div
                                            key={lang.id}
                                            onClick={() => toggleLanguage(lang.id)}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                selected
                                                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                                                    : 'bg-white border-ink-100 hover:border-ink-300 hover:bg-ink-50'
                                            }`}
                                        >
                                            <div className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden border ${selected ? 'border-primary-200 bg-white' : 'border-ink-100 bg-ink-50'}`}>
                                                {lang.iconUrl
                                                    ? <img src={lang.iconUrl} alt={lang.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                                    : <span className="text-[9px] font-black text-ink-400">{lang.name.slice(0,2).toUpperCase()}</span>
                                                }
                                            </div>
                                            <span className={`text-sm font-semibold flex-1 truncate ${selected ? 'text-primary-700' : 'text-ink-700'}`}>{lang.name}</span>
                                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${selected ? 'bg-primary-600 border-primary-600' : 'border-ink-300 bg-white'}`}>
                                                {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 px-5 py-4 border-t border-ink-200 bg-ink-50/50">
                    <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-ink-700 bg-white border border-ink-300 rounded-xl hover:bg-ink-50 transition-colors disabled:opacity-50">
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-600 to-primary-600 text-white text-sm font-semibold rounded-xl shadow-glow-primary hover:shadow-glow-accent active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={16} /> Đang lưu...</>
                        ) : (
                            framework ? "Cập nhật" : "Tạo framework"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FrameworkDialog;
