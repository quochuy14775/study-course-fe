import React, { useState, useEffect } from 'react';
import { Search, User, Bookmark, Settings, LogOut, BookOpen, ChevronDown, Code2, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import Cookies from 'js-cookie';
import NotificationDropdown from './NotificationDropdown';

interface UserProfile {
    name: string;
    email: string;
}

const Header: React.FC = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const toggleMobile = useUiStore((s) => s.toggleSidebarMobile);
    const mobileOpen = useUiStore((s) => s.sidebarMobileOpen);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const userProfile: UserProfile = {
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const input = document.getElementById('global-search');
                input?.focus();
                setMobileSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const handleLogout = () => {
        Cookies.remove('token');
        logout();
        setIsDropdownOpen(false);
        navigate('/login');
    };

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-ink-200 sticky top-0 z-50">
            <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-2">
                    {/* Left: hamburger + logo */}
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Mobile hamburger */}
                        <button
                            onClick={toggleMobile}
                            className="md:hidden p-2 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors"
                            aria-label="Mở menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Logo */}
                        <div
                            className="flex items-center gap-2 cursor-pointer group min-w-0"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-glow-primary group-hover:scale-105 transition-transform flex-shrink-0">
                                <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            {/* Brand text — hide on very small screens to save room */}
                            <div className="hidden sm:flex items-baseline gap-0.5 font-mono">
                                <span className="text-ink-400 text-xl font-semibold">&lt;</span>
                                <span className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                                    EduHub
                                </span>
                                <span className="text-ink-400 text-xl font-semibold">/&gt;</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Search bar (md+) */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
                        <div className={`relative w-full transition-all duration-200 ${searchFocused ? 'scale-[1.01]' : ''}`}>
                            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-primary-600' : 'text-ink-400'}`} />
                            <input
                                id="global-search"
                                type="text"
                                placeholder="Tìm khóa học, bài viết..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                className="w-full pl-10 pr-16 py-2.5 text-sm rounded-xl border border-ink-200 bg-ink-50/50 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-ink-500 bg-white border border-ink-200 rounded-md shadow-sm">
                                <span>⌘</span><span>K</span>
                            </kbd>
                        </div>
                    </div>

                    {/* Right: search icon (mobile) + notifications + profile */}
                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                        {/* Mobile-only search button */}
                        <button
                            onClick={() => setMobileSearchOpen((v) => !v)}
                            className="md:hidden p-2 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                            aria-label="Tìm kiếm"
                        >
                            <Search size={18} />
                        </button>

                        <NotificationDropdown
                            notifications={[
                                { id: 1, message: 'Khóa học mới: Advanced TypeScript', time: '2 giờ trước', type: 'info' },
                                { id: 2, message: 'Bạn đã hoàn thành React Fundamentals', time: '1 ngày trước', type: 'success' },
                                { id: 3, message: 'Giảm 30% cho khóa Pro', time: '3 ngày trước', type: 'warning' },
                            ]}
                            onViewAll={() => console.log('View all')}
                        />

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-full hover:bg-ink-100 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-soft">
                                    {userProfile.name.charAt(0)}
                                </div>
                                <ChevronDown className={`hidden sm:block w-4 h-4 text-ink-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white border border-ink-200 rounded-2xl shadow-soft-lg z-50 overflow-hidden animate-fade-in-up">
                                    <div className="px-4 py-4 bg-gradient-to-br from-primary-50 to-accent-50 border-b border-ink-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white font-bold shadow-glow-primary">
                                                {userProfile.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-ink-900 truncate">{userProfile.name}</p>
                                                <p className="text-xs text-ink-500 truncate">{userProfile.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <nav className="py-2">
                                        <MenuItem icon={<User className="w-4 h-4" />} label="Trang cá nhân" onClick={() => { navigate('/personal'); setIsDropdownOpen(false); }} />
                                        <MenuItem icon={<BookOpen className="w-4 h-4" />} label="Khóa học của tôi" onClick={() => setIsDropdownOpen(false)} />
                                        <MenuItem icon={<Bookmark className="w-4 h-4" />} label="Đã lưu" onClick={() => setIsDropdownOpen(false)} />
                                        <MenuItem icon={<Settings className="w-4 h-4" />} label="Cài đặt" onClick={() => setIsDropdownOpen(false)} />
                                    </nav>

                                    <div className="border-t border-ink-200">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium flex items-center gap-3"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile search bar — collapsible row below header */}
                {mobileSearchOpen && (
                    <div className="md:hidden pb-3 animate-fade-in-up">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Tìm khóa học, bài viết..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-ink-200 bg-ink-50/50 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all"
                            />
                            <button
                                onClick={() => setMobileSearchOpen(false)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-ink-400 hover:text-ink-700"
                                aria-label="Đóng tìm kiếm"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            )}
        </header>
    );
};

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full px-4 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50 hover:text-primary-600 transition-colors flex items-center gap-3 group"
    >
        <span className="text-ink-500 group-hover:text-primary-600 transition-colors">{icon}</span>
        <span className="font-medium">{label}</span>
    </button>
);

export default Header;
