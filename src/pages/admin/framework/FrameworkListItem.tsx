import React from 'react';
import { Edit2, Trash2, Calendar, Layers } from 'lucide-react';
import type { Framework } from '../../../types/framework';

interface Props {
    framework: Framework;
    onEdit?: (framework: Framework) => void;
    onDelete?: (id: number) => void;
}

const FrameworkListItem: React.FC<Props> = ({ framework, onEdit, onDelete }) => {
    return (
        <div className="group bg-white border border-ink-200 hover:border-primary-300 rounded-2xl shadow-soft overflow-hidden mb-3 transition-all">
            <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-accent-50 to-primary-50 border border-ink-200 flex items-center justify-center">
                    {framework.iconUrl ? (
                        <img
                            src={framework.iconUrl}
                            alt={framework.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                            }}
                        />
                    ) : (
                        <Layers className="w-6 h-6 text-accent-500" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-ink-900 truncate group-hover:text-primary-700 transition-colors">
                            {framework.name}
                        </h3>
                        <span className="font-mono text-[10px] text-ink-400 bg-ink-50 border border-ink-200 px-1.5 py-0.5 rounded">
                            {framework.slug}
                        </span>
                        {framework.isActive ? (
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

                    {/* Languages chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {framework.languages?.length > 0 ? (
                            framework.languages.slice(0, 5).map(lang => (
                                <span key={lang.id} className="px-2 py-0.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-md text-[10px] font-semibold">
                                    {lang.name}
                                </span>
                            ))
                        ) : (
                            <span className="text-[11px] text-ink-400 italic">Chưa có ngôn ngữ</span>
                        )}
                        {framework.languages?.length > 5 && (
                            <span className="px-2 py-0.5 bg-ink-100 text-ink-500 rounded-md text-[10px]">
                                +{framework.languages.length - 5}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[11px] text-ink-400 font-mono">
                            <Calendar size={10} />
                            {new Date(framework.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(framework)}
                            className="p-2 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Sửa framework"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(framework.id)}
                            className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa framework"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FrameworkListItem;
