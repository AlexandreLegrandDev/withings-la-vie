import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { NutrientIntake } from '@/types';

/** Badge « +34 % » quand un nutriment dépasse son objectif : on garde la visibilité sur la surconsommation. */
export function OverBadge({ actualPercent, className }: { actualPercent: number; className?: string }) {
    if (actualPercent <= 100) return null;

    return (
        <span className={cn('bg-rose-soft text-rose-ink rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', className)}>
            +{actualPercent - 100} %
        </span>
    );
}

/**
 * Barre d'un nutriment : « 134 / 100 g » et une jauge.
 * Avec eaten/target (page Aujourd'hui) ou seulement un pourcentage (moyennes de la page Suivi).
 */
export function NutrientBar({
    label,
    percent,
    actualPercent = percent,
    eaten,
    target,
    unit,
    goodFrom,
}: Pick<NutrientIntake, 'label' | 'percent'> &
    Partial<Pick<NutrientIntake, 'actualPercent' | 'eaten' | 'target' | 'unit'>> & {
        /** À partir de ce pourcentage, la jauge passe en vert (ex. 90 sur la page Suivi). */
        goodFrom?: number;
    }) {
    const over = actualPercent > 100;

    return (
        <li>
            <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-subtle flex items-center gap-1.5 tabular-nums">
                    <OverBadge actualPercent={actualPercent} />
                    {eaten !== undefined && target !== undefined ? (
                        <span className={cn(over && 'text-rose-ink font-semibold')}>
                            {formatNumber(eaten)} / {formatNumber(target)} {unit}
                        </span>
                    ) : (
                        <span>{percent} %</span>
                    )}
                </span>
            </div>
            <div
                className="bg-muted mt-1 h-2 overflow-hidden rounded-full"
                role="progressbar"
                aria-label={label}
                aria-valuenow={actualPercent}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-[width] duration-700',
                        over ? 'bg-rose-ink dark:bg-brand' : goodFrom !== undefined && percent >= goodFrom ? 'bg-leaf' : 'bg-candy',
                    )}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
        </li>
    );
}
