import { BrowsingHistoryItem } from "../mockDatas/mockBrowsingHistory";
import React from "react";
import { Trash2 } from "lucide-react";

interface HistoryItemProps {
    item: BrowsingHistoryItem;
    formatDate: (date: Date) => string;
    onDelete: (id: string) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, formatDate, onDelete }) => {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
                <span className="text-xl">{item.thumbnail}</span>
                <div>
                    <h4 className="text-sm font-medium text-slate-900 leading-none">{item.courseTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.category} — {item.duration} min</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-medium">{formatDate(item.visitedAt)}</span>
                <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
