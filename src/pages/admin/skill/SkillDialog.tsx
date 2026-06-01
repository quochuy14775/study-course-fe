import React, { useState, useEffect, useRef } from "react";
import { X, Box, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import { Skill, SkillRequest } from "../../../types/skill";
import CustomCheckbox from "../../../components/CustomCheckbox";

interface Props {
    open: boolean;
    skill: Skill | null;
    onClose: () => void;
    onSubmit: (data: SkillRequest) => Promise<void>;
}

const SkillDialog: React.FC<Props> = ({ open, skill, onClose, onSubmit }) => {
    const [form, setForm] = useState<SkillRequest>({
        name: "",
        description: "",
        iconUrl: "",
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const nameRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (open) {
            if (skill) {
                setForm({
                    name: skill.name,
                    description: skill.description || "",
                    iconUrl: skill.iconUrl || "",
                    isActive: skill.isActive,
                });
            } else {
                setForm({
                    name: "",
                    description: "",
                    iconUrl: "",
                    isActive: true,
                });
            }
            setErrors({});
        }
    }, [open, skill]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

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
                <div className="px-5 py-4 border-b border-ink-200 bg-gradient-to-br from-primary-50/60 to-accent-50/60">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-glow-primary">
                                <Box className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-ink-900">
                                    {skill ? "Cập nhật kỹ năng" : "Thêm kỹ năng mới"}
                                </h2>
                                <p className="text-xs text-ink-500 font-mono">Dùng để gán vào các khóa học</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-white/60 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            Tên kỹ năng <span className="text-rose-500">*</span>
                        </label>
                        <input
                            ref={nameRef}
                            placeholder="vd: React Native, Python, SQL..."
                            value={form.name}
                            onChange={(e) => { setForm({ ...form, name: e.target.value }); if(errors.name) setErrors(prev => { const n = {...prev}; delete n.name; return n;})}}
                            className={`${inputBase} ${errors.name ? inputError : inputValid}`}
                        />
                        {errors.name && (
                            <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide">
                            Mô tả
                        </label>
                        <textarea
                            placeholder="Mô tả kỹ năng này giúp ích gì..."
                            value={form.description || ""}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className={`${inputBase} min-h-[80px] resize-y border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15`}
                        />
                    </div>

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

                    <div className="p-3 rounded-xl bg-slate-50 border border-ink-100">
                        <CustomCheckbox
                            checked={form.isActive}
                            onChange={(checked) => setForm({ ...form, isActive: checked })}
                            label={"Đang hoạt động"}
                        />
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
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                {skill ? "Cập nhật" : "Tạo kỹ năng"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkillDialog;

