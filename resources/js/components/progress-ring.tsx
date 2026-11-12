import { useGrowFrom } from '@/hooks/use-animated-value';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ProgressRingProps {
    /** Avancement de 0 à 100 (au-delà, l'anneau reste plein et passe en rose foncé). */
    percent: number;
    /** Taille du rond (classe Tailwind, ex. « size-12 »). */
    className?: string;
    /** Couleur du fond de l'anneau (classe stroke-*), et remplissage du centre (classe fill-*). */
    trackClassName?: string;
    /** Épaisseur du trait, sur une base de 100. */
    strokeWidth?: number;
    /** Objectif dépassé : anneau plus foncé, pour signaler la surconsommation. */
    over?: boolean;
    label: string;
    /** Ce qu'on affiche au centre. */
    children?: ReactNode;
}

/** Anneau de progression en SVG : le trait rose fait percent % du tour. */
export function ProgressRing({
    percent,
    className,
    trackClassName = 'stroke-card fill-card',
    strokeWidth = 10,
    over = false,
    label,
    children,
}: ProgressRingProps) {
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    // L'anneau se remplit depuis 0 à l'ouverture de la page
    const filled = useGrowFrom(Math.min(100, Math.max(0, percent)), 0);

    return (
        <div className={cn('relative shrink-0', className)} role="img" aria-label={label}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={radius} strokeWidth={strokeWidth} className={trackClassName} />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap={filled > 0 && filled < 100 ? 'round' : 'butt'}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - filled / 100)}
                    className={cn(
                        'transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none',
                        over ? 'stroke-rose-ink' : 'stroke-brand',
                    )}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
        </div>
    );
}
