import React from 'react';
import { Edit2, Trash2, Calendar, Code2 } from 'lucide-react';
import type { Language } from '../../../types/language';

interface Props {
    language: Language;
    onEdit?: (language: Language) => void;
    onDelete?: (id: number) => void;
}

const LanguageListItem: React.FC<Props> = ({ language, onEdit, onDelete }) => {
    return (
        <div className="group bg-white border border-ink-200 hover:border-primary-300 rounded-2xl shadow-soft overflow-hidden mb-3 transition-all">
            <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 border border-ink-200 flex items-center justify-center">
                    {language.iconUrl ? (
                        <img
                            src={language.iconUrl}
                            alt={language.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                            }}
                        />
                    ) : (
                        <Code2 className="w-6 h-6 text-primary-500" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-ink-900 truncate group-hover:text-primary-700 transition-colors">
                            {language.name}
                        </h3>
                        <span className="font-mono text-[10px] text-ink-400 bg-ink-50 border border-ink-200 px-1.5 py-0.5 rounded">
                            {language.slug}
                        </span>
                        {language.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                ACTIVE
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-100 text-ink-500 text-[10px] font-bold">
                                <span className="w-1 h-1 rounded-full bg-ink-400" />
                                INACTIVE
                            </span>
                        )}
                    </div>

                    {/* Frameworks chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {language.frameworks?.length > 0 ? (
                            language.frameworks.slice(0, 5).map(fw => (
                                <span key={fw.id} className="px-2 py-0.5 bg-accent-50 border border-accent-200 text-accent-700 rounded-md text-[10px] font-semibold">
                                    {fw.name}
                                </span>
                            ))
                        ) : (
                            <span className="text-[11px] text-ink-400 italic">Chưa có framework</span>
                        )}
                        {language.frameworks?.length > 5 && (
                            <span className="px-2 py-0.5 bg-ink-100 text-ink-500 rounded-md text-[10px]">
                                +{language.frameworks.length - 5}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[11px] text-ink-400 font-mono">
                            <Calendar size={10} />
                            {new Date(language.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(language)}
                            className="p-2 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Sửa ngôn ngữ"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(language.id)}
                            className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa ngôn ngữ"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LanguageListItem;
