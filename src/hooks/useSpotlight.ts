import { useCallback, useRef } from 'react';

/**
 * Glow đi theo chuột cho card (class `spotlight` trong index.css).
 * Ghi thẳng CSS var lên element — không re-render React mỗi lần chuột di chuyển.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T>(null);

    const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    }, []);

    return { ref, onMouseMove };
}
