import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ProgressRingProps {
    /** Avancement de 0 à 100. */
    percent: number;
    /** Taille du rond (classe Tailwind, ex. « size-12 »). */
    className?: string;
    /** Couleur du fond de l'anneau (classe stroke-*), et remplissage du centre (classe fill-*). */
    trackClassName?: string;
    /** Épaisseur du trait, sur une base de 100. */
    strokeWidth?: number;
    label: string;
    /** Ce qu'on affiche au centre. */
    children?: ReactNode;
}

/** Anneau de progression en SVG : le trait rose fait percent % du tour. */
export function ProgressRing({
    percent,
    className,
    trackClassName = 'stroke-white fill-white',
    strokeWidth = 10,
    label,
    children,
}: ProgressRingProps) {
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className={cn('relative shrink-0', className)} role="img" aria-label={label}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={radius} strokeWidth={strokeWidth} className={trackClassName} />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth={strokeWidth}
                    strokeLinecap={percent > 0 && percent < 100 ? 'round' : 'butt'}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - percent / 100)}
                    className="transition-[stroke-dashoffset] duration-700"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
        </div>
    );
}
