import React from 'react';
import { Edit2, Trash2, Calendar, Box } from 'lucide-react';
import { Skill } from '../../../types/skill';

interface Props {
    skill: Skill;
    onEdit?: (skill: Skill) => void;
    onDelete?: (id: number) => void;
}

const SkillListItem: React.FC<Props> = ({ skill, onEdit, onDelete }) => {
    return (
        <div className="group bg-white border border-ink-200 hover:border-primary-300 rounded-2xl shadow-soft overflow-hidden mb-3 transition-all">
            <div className="flex items-center gap-4 p-4">
                {/* Icon/Thumbnail */}
                <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 border border-ink-200 flex items-center justify-center">
                    {skill.iconUrl ? (
                        <img
                            src={skill.iconUrl}
                            alt={skill.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const placeholder = img.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                            }}
                        />
                    ) : (
                        <Box className="w-6 h-6 text-primary-500" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-ink-900 truncate group-hover:text-primary-700 transition-colors">
                            {skill.name}
                        </h3>
                        {skill.isActive ? (
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

                    <p className="text-xs text-ink-500 line-clamp-1 leading-relaxed">
                        {skill.description || <span className="italic text-ink-400">Không có mô tả</span>}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[11px] text-ink-400 font-mono">
                            <Calendar size={10} />
                            {new Date(skill.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(skill)}
                            className="p-2 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Sửa kỹ năng"
                        >
                            <Edit2 size={14} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(skill.id)}
                            className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa kỹ năng"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkillListItem;

