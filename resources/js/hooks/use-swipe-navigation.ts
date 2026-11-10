import { navLinks } from '@/lib/nav-links';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/** Distance horizontale minimale (px) pour compter le geste comme un glissement. */
const MIN_DISTANCE = 60;
/** Marge (px) au bord de l'écran ignorée : ces bords servent déjà au « retour » d'iOS et d'Android. */
const EDGE = 24;

/** Éléments où un glissement ne doit pas changer de page (saisie, curseurs…). Ajouter data-no-swipe pour exclure une zone. */
const IGNORED = 'input, textarea, select, [contenteditable="true"], [role="slider"], [data-no-swipe]';

/** Vrai si le doigt est sur une zone qui défile déjà à l'horizontale (carrousel, graphique…). */
function inHorizontalScroll(el: Element | null) {
    for (; el && el !== document.body; el = el.parentElement) {
        const { overflowX } = getComputedStyle(el);
        if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth) return true;
    }
    return false;
}

/**
 * Glisser vers la gauche → page suivante du menu, vers la droite → page précédente.
 * Actif seulement sur les 4 pages du menu (pas sur les sous-pages comme les réglages, qui ont leur bouton retour).
 */
export function useSwipeNavigation(url: string) {
    useEffect(() => {
        const path = url.split('?')[0];
        const index = navLinks.findIndex((link) => link.href === path);
        if (index === -1) return;

        let start: { x: number; y: number } | null = null;

        const onStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            const target = e.target as Element;
            const nearEdge = touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE;
            start =
                e.touches.length > 1 || nearEdge || target.closest(IGNORED) || inHorizontalScroll(target)
                    ? null
                    : { x: touch.clientX, y: touch.clientY };
        };

        const onEnd = (e: TouchEvent) => {
            if (!start) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            start = null;

            // Geste nettement horizontal et assez long, pour ne pas gêner le défilement vertical
            if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) return;

            // Doigt vers la gauche (dx < 0) → page suivante
            const next = navLinks[index + (dx < 0 ? 1 : -1)];
            if (next) router.visit(next.href);
        };

        // passive : n'empêche jamais le défilement normal de la page
        window.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchend', onEnd, { passive: true });
        return () => {
            window.removeEventListener('touchstart', onStart);
            window.removeEventListener('touchend', onEnd);
        };
    }, [url]);
}
