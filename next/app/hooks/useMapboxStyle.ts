'use client';

import { useEffect, useState } from 'react';

const DARK_STYLE = '/mapbox-style-dark.json';
const LIGHT_STYLE = '/mapbox-style-light.json';

/**
 * Returns the correct Mapbox style URL based on the app's
 * dark/light theme (the `dark` class on <html>).
 * Re-evaluates whenever the class changes.
 */
export function useMapboxStyle(): string {
    const [style, setStyle] = useState<string>(() => {
        const isDark = document.documentElement.classList.contains('dark');
        return isDark ? DARK_STYLE : LIGHT_STYLE;
    });

    useEffect(() => {
        const htmlEl = document.documentElement;

        const update = () => {
            const isDark = htmlEl.classList.contains('dark');
            setStyle(isDark ? DARK_STYLE : LIGHT_STYLE);
        };

        // Watch the <html> class for dark-mode toggling
        const observer = new MutationObserver(update);
        observer.observe(htmlEl, { attributes: true, attributeFilter: ['class'] });

        // Reconcile on mount
        update();

        return () => observer.disconnect();
    }, []);

    return style;
}
