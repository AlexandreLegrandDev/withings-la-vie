import { useEffect, useRef, useState } from 'react';

/** Vrai si le téléphone demande moins d'animations : les valeurs s'affichent alors directement. */
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Vaut `from` au premier affichage, puis `value` juste après : une transition CSS (largeur, hauteur, anneau)
 * part donc de zéro à l'ouverture de la page au lieu d'apparaître déjà remplie.
 */
export function useGrowFrom<T>(value: T, from: T): T {
    const [mounted, setMounted] = useState(prefersReducedMotion);

    useEffect(() => {
        // Deux images plus tard : le navigateur a bien dessiné l'état de départ avant de lancer la transition
        let second = 0;
        const first = requestAnimationFrame(() => {
            second = requestAnimationFrame(() => setMounted(true));
        });
        return () => {
            cancelAnimationFrame(first);
            cancelAnimationFrame(second);
        };
    }, []);

    return mounted ? value : from;
}

/** Nombre qui défile de sa valeur précédente (0 au départ) jusqu'à `value`, en ralentissant à la fin. */
export function useCountUp(value: number, duration = 800): number {
    const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0));
    // Valeur affichée à l'instant, pour repartir de là si `value` change pendant l'animation
    const current = useRef(display);

    useEffect(() => {
        if (prefersReducedMotion()) {
            current.current = value;
            setDisplay(value);
            return;
        }

        const from = current.current;
        let start: number | null = null;
        let frame = 0;

        const step = (time: number) => {
            start ??= time;
            const progress = Math.min(1, (time - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            current.current = from + (value - from) * eased;
            setDisplay(current.current);
            if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frame);
    }, [value, duration]);

    return display;
}
