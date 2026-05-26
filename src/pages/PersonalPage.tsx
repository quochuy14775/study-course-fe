import React, { useState } from 'react';
import { Trash2, Search, Zap, Plus } from 'lucide-react';
import { browsingHistory, personalInfo, BrowsingHistoryItem, generateContributionData } from '../mockDatas/mockBrowsingHistory';
import { ContributionGraph } from "../components/ContributionGraph";
import { StatCard } from "../components/StatCard";
import { HistoryItem } from "../components/HistoryItem";

const PersonalPage: React.FC = () => {
    const [history, setHistory] = useState<BrowsingHistoryItem[]>(browsingHistory);
    const [searchQuery, setSearchQuery] = useState('');
    const [contributionData] = useState(generateContributionData());

    const filteredHistory = history
        .filter(item => item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime())
        .slice(0, 5); // Just show recent 5 for activity card

    const handleClearHistory = () => {
        if (window.confirm('Clear all activity?')) setHistory([]);
    };

    const handleDeleteItem = (id: string) => {
        setHistory(history.filter(item => item.id !== id));
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d`;
    };

    return (
        <main className="min-h-screen bg-ink-50 relative">
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
            <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">

                {/* Page header */}
                <section className="animate-fade-in-up">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
                        <span className="text-ink-400">~/</span>
                        <span>personal</span>
                        <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900">Trang cá nhân</h1>
                </section>

                {/* TOP GRID: PROFILE & ACHIEVEMENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. PROFILE CARD */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-6">
                        <img
                            src={personalInfo.avatar}
                            alt={personalInfo.name}
                            className="w-20 h-20 rounded-full border border-slate-100 shadow-sm"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-900">{personalInfo.name}</h1>
                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full border border-orange-100 flex items-center gap-1">
                                    <Zap className="w-3 h-3 fill-current" /> 🔥 {personalInfo.streak} DAYS
                                </span>
                            </div>
                            <p className="text-sm font-medium text-slate-500">{personalInfo.role}</p>
                            <p className="text-sm text-slate-400 mt-2 line-clamp-1">{personalInfo.bio}</p>
                        </div>
                    </div>

                    {/* 2. ACHIEVEMENTS CARD */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Achievements</h3>
                            <span className="text-xs font-bold text-blue-600">{personalInfo.points.toLocaleString()} pts</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {personalInfo.achievements.map((ach, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-100 hover:ring-2 hover:ring-blue-50 transition-all cursor-default"
                                >
                                    {ach.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MIDDLE GRID: STATS & SKILLS & ACTIVITY */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* 3. STATS CARD */}
                    <div className="space-y-4">
                        <StatCard label="Total study time" value={personalInfo.totalStudyTime} />
                        <StatCard label="Lessons completed" value={personalInfo.totalCoursesCompleted} />
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="Rate" value={`${personalInfo.completionRate}%`} />
                            <StatCard label="Rank" value={personalInfo.rank.split(' ')[0]} />
                        </div>
                    </div>

                    {/* 4. SKILLS PROGRESS */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">Skills Progress</h3>
                        <div className="space-y-5">
                            {personalInfo.skills.map((skill, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-700">{skill.name}</span>
                                        <span className="text-slate-400">{skill.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${skill.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. RECENT ACTIVITY CARD */}
                    <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Activity</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <input
                                        type="text"
                                        className="pl-6 py-1 text-[10px] bg-slate-50 border border-slate-100 rounded-md focus:outline-none w-24"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleClearHistory} className="text-slate-300 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 divide-y divide-slate-50 overflow-y-auto">
                            {filteredHistory.map(item => (
                                <HistoryItem
                                    key={item.id}
                                    item={item}
                                    formatDate={formatDate}
                                    onDelete={handleDeleteItem}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. CONTRIBUTION GRAPH - FULL WIDTH */}
                <section>
                    <ContributionGraph contributions={contributionData} />
                </section>

                {/* 7. EXTENSIBILITY (Modular Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] group cursor-pointer hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Add Certificates</p>
                            <p className="text-xs text-slate-500">Show off your verified skills</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] group cursor-pointer hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Add Leaderboard</p>
                            <p className="text-xs text-slate-500">See how you rank in the community</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] group cursor-pointer hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">AI Recommendations</p>
                            <p className="text-xs text-slate-500">Personalized paths for your goals</p>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
};


export default PersonalPage;
