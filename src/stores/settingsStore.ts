import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccentColor = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber' | 'cyan';
export type FontSize = 'sm' | 'md' | 'lg';
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
    // Giao diện
    themeMode: ThemeMode;
    accentColor: AccentColor;
    fontSize: FontSize;
    sidebarDefaultCollapsed: boolean;
    reducedMotion: boolean;

    // Học tập
    dailyGoalMinutes: number;
    autoPlayNext: boolean;
    showProgressBar: boolean;
    reminderEnabled: boolean;
    reminderTime: string;

    // Thông báo
    notifyNewCourse: boolean;
    notifyComments: boolean;
    notifyArticles: boolean;

    // Actions
    setThemeMode: (m: ThemeMode) => void;
    setAccentColor: (c: AccentColor) => void;
    setFontSize: (s: FontSize) => void;
    setSidebarDefaultCollapsed: (v: boolean) => void;
    setReducedMotion: (v: boolean) => void;
    setDailyGoalMinutes: (v: number) => void;
    setAutoPlayNext: (v: boolean) => void;
    setShowProgressBar: (v: boolean) => void;
    setReminderEnabled: (v: boolean) => void;
    setReminderTime: (v: string) => void;
    setNotifyNewCourse: (v: boolean) => void;
    setNotifyComments: (v: boolean) => void;
    setNotifyArticles: (v: boolean) => void;
    resetAll: () => void;
}

const defaults = {
    themeMode: 'light' as ThemeMode,
    accentColor: 'violet' as AccentColor,
    fontSize: 'md' as FontSize,
    sidebarDefaultCollapsed: false,
    reducedMotion: false,
    dailyGoalMinutes: 30,
    autoPlayNext: true,
    showProgressBar: true,
    reminderEnabled: false,
    reminderTime: '20:00',
    notifyNewCourse: true,
    notifyComments: true,
    notifyArticles: false,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...defaults,
            setThemeMode: (themeMode) => set({ themeMode }),
            setAccentColor: (accentColor) => set({ accentColor }),
            setFontSize: (fontSize) => set({ fontSize }),
            setSidebarDefaultCollapsed: (sidebarDefaultCollapsed) => set({ sidebarDefaultCollapsed }),
            setReducedMotion: (reducedMotion) => set({ reducedMotion }),
            setDailyGoalMinutes: (dailyGoalMinutes) => set({ dailyGoalMinutes }),
            setAutoPlayNext: (autoPlayNext) => set({ autoPlayNext }),
            setShowProgressBar: (showProgressBar) => set({ showProgressBar }),
            setReminderEnabled: (reminderEnabled) => set({ reminderEnabled }),
            setReminderTime: (reminderTime) => set({ reminderTime }),
            setNotifyNewCourse: (notifyNewCourse) => set({ notifyNewCourse }),
            setNotifyComments: (notifyComments) => set({ notifyComments }),
            setNotifyArticles: (notifyArticles) => set({ notifyArticles }),
            resetAll: () => set(defaults),
        }),
        { name: 'app-settings' }
    )
);
