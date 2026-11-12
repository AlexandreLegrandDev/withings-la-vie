import { AnimatedNumber } from '@/components/animated-number';
import { mealLabel, type MealStatus, type MealType } from '@/lib/meals';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';

interface MealCardProps {
    type: MealType;
    /** Numéro quand il y a plusieurs collations (« Collation 2 »), null sinon. */
    number?: number | null;
    status: MealStatus;
    /** Part prévue des besoins du jour, en %. */
    share: number;
    /** Part réelle des besoins du jour apportée par ce repas, null tant qu'il n'est pas commencé. */
    dayPercent: number | null;
    /** Id du repas en base, ou null s'il n'a pas encore été créé. */
    mealId: number | null;
}

/** Couleurs et décoration de chaque repas (relevées sur la maquette). */
const styles: Record<MealType, { card: string; ink: string; decoration?: (props: { className?: string }) => React.JSX.Element }> = {
    breakfast: { card: 'bg-mint', ink: 'text-mint-ink' },
    lunch: { card: 'bg-rose', ink: 'text-rose-ink', decoration: Plate },
    snack: { card: 'bg-sun', ink: 'text-sun-ink', decoration: Star },
    dinner: { card: 'bg-sky', ink: 'text-sky-ink', decoration: Cloud },
};

/** Part des besoins prévue pour une part de repas : « 25 % » / « 3,3 % ». */
const formatShare = (share: number) => `${share.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;

export function MealCard({ type, number = null, status, share, dayPercent, mealId }: MealCardProps) {
    const style = styles[type];
    const Decoration = style.decoration;

    const className = cn(
        'relative flex h-40 flex-col overflow-hidden rounded-3xl p-4 text-left transition active:scale-[0.97]',
        style.card,
        // Repas en cours : entouré de rose
        status === 'in_progress' && 'ring-brand ring-2 ring-inset',
    );

    const content = (
        <>
            <StatusBadge status={status} />
            {Decoration && <Decoration />}
            <span className={cn('mt-auto text-lg leading-tight font-bold', status === 'done' && 'text-subtle')}>{mealLabel(type, number)}</span>
            {dayPercent !== null && (
                <span className={cn('text-sm', style.ink)}>
                    <span className="font-semibold">
                        <AnimatedNumber value={dayPercent} /> %
                    </span>{' '}
                    de ta journée
                </span>
            )}
            <span className={cn('text-xs', style.ink)}>Prévu : {formatShare(share)}</span>
        </>
    );

    // Repas déjà en base : lien direct vers sa page (/repas/12)
    if (mealId !== null) {
        return (
            <Link href={route('meals.show', mealId)} prefetch className={className}>
                {content}
            </Link>
        );
    }

    // Repas pas encore créé : le clic l'enregistre (POST /repas), puis le serveur redirige vers sa page
    return (
        <Link href={route('meals.store')} method="post" data={{ type }} as="button" className={className}>
            {content}
        </Link>
    );
}

export function StatusBadge({ status }: { status: MealStatus }) {
    if (status === 'done') {
        return (
            <span className="bg-card text-mint-ink flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
                <Check className="size-3.5" strokeWidth={2.5} />
                Terminé
            </span>
        );
    }
    if (status === 'in_progress') {
        return <span className="bg-brand w-fit rounded-full px-3 py-1 text-xs font-semibold text-white">En cours</span>;
    }
    return <span className="bg-card text-subtle w-fit rounded-full px-2.5 py-1 text-xs font-medium">À faire</span>;
}

/* Décorations en haut à droite des cartes (aria-hidden : purement visuelles) */

export function Plate({ className }: { className?: string }) {
    return (
        <span aria-hidden className={cn('bg-card absolute top-3 right-3 size-10 rounded-full', className)}>
            <span className="bg-candy absolute top-2.5 left-2 size-3.5 rounded-full" />
            <span className="bg-butter absolute top-2 right-2 size-2 rounded-full" />
            <span className="bg-leaf absolute right-2 bottom-2 size-3 rounded-full" />
        </span>
    );
}

export function Star({ className = 'absolute top-3 right-3 size-10' }: { className?: string }) {
    return (
        <svg aria-hidden viewBox="0 0 24 24" className={cn('fill-butter', className)}>
            <path d="M12 1.5l3.1 6.9 7.4.7-5.6 5 1.6 7.4L12 17.7l-6.5 3.8 1.6-7.4-5.6-5 7.4-.7z" />
        </svg>
    );
}

function Cloud() {
    return (
        <svg aria-hidden viewBox="0 0 64 30" className="fill-card absolute top-5 right-2 w-17">
            <path d="M8 30a8 8 0 0 1 0-16 11 11 0 0 1 20-5 10 10 0 0 1 17 3 9 9 0 0 1 11 2 8 8 0 0 1 0 16z" />
        </svg>
    );
}
