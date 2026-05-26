import React, { useState } from "react";
import { createPortal } from "react-dom";

interface ContributionGraphProps {
    contributions: Array<{ date: Date; count: number }>;
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ contributions }) => {
    const [hoveredCell, setHoveredCell] = useState<{ date: Date; count: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const getColorClass = (count: number): string => {
        if (count === 0) return 'bg-slate-100';
        if (count === 1) return 'bg-emerald-200';
        if (count === 2) return 'bg-emerald-400';
        if (count === 3) return 'bg-emerald-500';
        return 'bg-emerald-600';
    };

    const getContributionLevel = (count: number): string => {
        if (count === 0) return 'No activity';
        if (count === 1) return 'Low activity';
        if (count === 2) return 'Moderate activity';
        if (count === 3) return 'Good activity';
        return 'High activity';
    };

    /* ================= GROUP WEEKS ================= */

    const weeks: Array<Array<{ date: Date; count: number }>> = [];
    let currentWeek: Array<{ date: Date; count: number }> = [];

    contributions.forEach((c, i) => {
        currentWeek.push(c);
        if (currentWeek.length === 7 || i === contributions.length - 1) {
            weeks.push([...currentWeek]);
            currentWeek = [];
        }
    });

    const monthLabels: { [key: number]: string } = {
        0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun',
        6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec',
    };

    const dayLabels = ['Mon', 'Wed', 'Fri']; // Only showing some for cleaner look

    /* ================= UI ================= */

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contribution — 365 Days</h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-[2px] bg-slate-100" />
                        <div className="w-3 h-3 rounded-[2px] bg-emerald-200" />
                        <div className="w-3 h-3 rounded-[2px] bg-emerald-400" />
                        <div className="w-3 h-3 rounded-[2px] bg-emerald-600" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">More</span>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-2">
                <div className="flex gap-1.5 min-w-max">
                    {/* DAY LABELS */}
                    <div className="flex flex-col justify-between py-6 mr-1">
                        {dayLabels.map(day => (
                            <span key={day} className="text-[10px] text-slate-400 h-3 flex items-center">{day}</span>
                        ))}
                    </div>

                    {/* WEEKS */}
                    <div className="flex gap-1">
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-1">
                                {/* MONTHS */}
                                <div className="h-4 text-[10px] text-slate-400">
                                    {(wi === 0 || weeks[wi - 1][0].date.getMonth() !== week[0].date.getMonth()) &&
                                      monthLabels[week[0].date.getMonth()]
                                    }
                                </div>

                                {/* DAYS */}
                                {week.map((day, di) => (
                                    <div
                                        key={`${wi}-${di}`}
                                        className={`w-3 h-3 rounded-[2px] cursor-pointer transition-colors duration-200
                                        hover:ring-1 hover:ring-slate-300
                                        ${getColorClass(day.count)}`}
                                        onMouseEnter={(e) => {
                                            setHoveredCell(day);
                                            setMousePos({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseMove={(e) => {
                                            setMousePos({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseLeave={() => setHoveredCell(null)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOOLTIP */}
                {hoveredCell && createPortal(
                    <div
                        className="fixed z-50 px-3 py-2 rounded-lg text-xs shadow-xl
                        bg-slate-900 text-white border border-slate-800
                        pointer-events-none
                        transition-all duration-150"
                        style={{
                            top: mousePos.y - 50,
                            left: mousePos.x,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="font-medium">
                            {hoveredCell.date instanceof Date ? hoveredCell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : String(hoveredCell.date)}
                        </div>
                        <div className="text-slate-300">
                            {hoveredCell.count} lessons completed • {getContributionLevel(hoveredCell.count)}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};