import { useEffect, useState } from 'react';

/** Thème choisi dans Paramètres → Apparence. « system » suit le réglage du téléphone. */
export type Appearance = 'light' | 'dark' | 'system';

/** Thème par défaut : clair (le thème sombre s'active dans les paramètres). */
const DEFAULT_APPEARANCE: Appearance = 'light';

const mediaQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

const savedAppearance = (): Appearance => {
    try {
        const saved = localStorage.getItem('appearance');
        return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : DEFAULT_APPEARANCE;
    } catch {
        return DEFAULT_APPEARANCE;
    }
};

/** Pose ou retire la classe .dark sur <html> (voir resources/css/app.css) et colore la barre du navigateur. */
const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && mediaQuery().matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#121216' : '#ffffff');
};

/** Au chargement de l'appli (app.tsx) : applique le thème enregistré et suit les changements du téléphone. */
export function initializeTheme() {
    applyTheme(savedAppearance());
    mediaQuery().addEventListener('change', () => applyTheme(savedAppearance()));
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);

    useEffect(() => setAppearance(savedAppearance()), []);

    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        try {
            localStorage.setItem('appearance', mode);
        } catch {
            // Stockage indisponible (navigation privée) : le thème s'applique quand même pour cette visite
        }
        applyTheme(mode);
    };

    return { appearance, updateAppearance };
}
