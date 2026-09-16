import { create } from "zustand";

interface UiState {
    /** Sidebar drawer state on mobile (< md). Always closed on desktop. */
    sidebarMobileOpen: boolean;
    /** Sidebar collapsed (icon-only) state on desktop. */
    sidebarCollapsed: boolean;
    /** Command palette (⌘K) đang mở. */
    commandPaletteOpen: boolean;

    toggleSidebarMobile: () => void;
    closeSidebarMobile: () => void;
    toggleSidebarCollapsed: () => void;
    setCommandPaletteOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
    sidebarMobileOpen: false,
    sidebarCollapsed: false,
    commandPaletteOpen: false,

    toggleSidebarMobile: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
    closeSidebarMobile: () => set({ sidebarMobileOpen: false }),
    toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
}));
