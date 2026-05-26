import React, { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Notification {
    id: number;
    message: string;
    time: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationDropdownProps {
    notifications?: Notification[];
    onViewAll?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    notifications = [
        { id: 1, message: 'Khóa học mới: Advanced TypeScript', time: '2 giờ trước', type: 'info' },
        { id: 2, message: 'Chứng chỉ đạt được: React Fundamentals', time: '1 ngày trước', type: 'success' },
        { id: 3, message: 'Khuyến mãi: Giảm 30% tất cả khóa Pro', time: '3 ngày trước', type: 'warning' },
    ],
    onViewAll,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const notificationCount = notifications.length;

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={18} className="text-code-600" />;
            case 'warning':
                return <AlertTriangle size={18} className="text-amber-600" />;
            case 'error':
                return <AlertCircle size={18} className="text-rose-600" />;
            default:
                return <Info size={18} className="text-primary-600" />;
        }
    };

    const handleViewAll = () => {
        if (onViewAll) {
            onViewAll();
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-ink-600 hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
                aria-label="Notifications"
                aria-expanded={isOpen}
            >
                <Bell size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-12' : ''}`} />
                {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Overlay to close dropdown */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-96 bg-white border border-ink-200 rounded-xl shadow-soft-lg z-50 overflow-hidden animate-fade-in-up">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between bg-gradient-to-r from-ink-50/80 to-primary-50/30">
                            <h3 className="font-bold text-ink-900">Thông báo</h3>
                            {notificationCount > 0 && (
                                <span className="text-xs font-semibold text-ink-600 bg-ink-100 rounded-full px-2 py-1">
                                    {notificationCount}
                                </span>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <div
                                        key={notification.id}
                                        className="px-4 py-3 border-b border-ink-100 hover:bg-ink-50/50 transition-all duration-200 cursor-pointer group animate-fade-in-up"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-ink-900 group-hover:text-primary-700 transition-colors">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-ink-500 mt-1 font-mono">
                                                    {notification.time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-sm text-ink-400">Không có thông báo</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-3 border-t border-ink-100 text-center bg-ink-50/50">
                                <button
                                    onClick={handleViewAll}
                                    className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                    Xem tất cả
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationDropdown;

