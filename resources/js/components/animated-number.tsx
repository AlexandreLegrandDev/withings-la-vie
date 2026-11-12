import { useCountUp } from '@/hooks/use-animated-value';

/** Nombre qui défile jusqu'à sa valeur (« 0 → 71 % »), arrondi à l'entier par défaut. */
export function AnimatedNumber({ value, decimals = 0, duration }: { value: number; decimals?: number; duration?: number }) {
    const display = useCountUp(value, duration);

    return <>{display.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}
