import React from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue }) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                {subValue && <span className="text-xs text-slate-400 font-medium">{subValue}</span>}
            </div>
        </div>
    );
};