import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';

/** Types de repas, identiques à la colonne « type » de la table meals. */
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/** État d'un repas, affiché dans le badge en haut à gauche de la carte. */
export type MealStatus = 'todo' | 'in_progress' | 'done';

interface MealCardProps {
    type: MealType;
    status: MealStatus;
    /** Part des apports de la journée prévue pour ce repas, en %. */
    share: number;
    /** Id du repas du jour en base, ou null s'il n'a pas encore été créé. */
    mealId: number | null;
}

/** Nom de chaque repas, réutilisé par la page d'un repas. */
export const mealLabels: Record<MealType, string> = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    snack: 'Collation',
    dinner: 'Dîner',
};

/** Couleurs et décoration de chaque repas (couleurs relevées sur la maquette). */
const meals: Record<MealType, { card: string; share: string; decoration?: () => React.JSX.Element }> = {
    breakfast: { card: 'bg-[#e0f5e9]', share: 'text-[#6fa087]' },
    lunch: { card: 'bg-[#ffd9e8]', share: 'text-[#cc7499]', decoration: Plate },
    snack: { card: 'bg-sun', share: 'text-neutral-500', decoration: Star },
    dinner: { card: 'bg-[#d9ecfa]', share: 'text-[#7997ac]', decoration: Cloud },
};

export function MealCard({ type, status, share, mealId }: MealCardProps) {
    const meal = meals[type];
    const Decoration = meal.decoration;

    const className = cn(
        'relative flex h-40 flex-col overflow-hidden rounded-3xl p-4 text-left transition active:scale-[0.97]',
        meal.card,
        // Repas en cours : entouré de rose
        status === 'in_progress' && 'ring-brand ring-2 ring-inset',
    );

    const content = (
        <>
            <StatusBadge status={status} />
            {Decoration && <Decoration />}
            <span className={cn('mt-auto text-lg leading-tight font-bold', status === 'done' && 'text-neutral-600')}>{mealLabels[type]}</span>
            <span className={cn('text-xs', meal.share)}>{share} % du jour</span>
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

function StatusBadge({ status }: { status: MealStatus }) {
    if (status === 'done') {
        return (
            <span className="flex w-fit items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#6fa087]">
                <Check className="size-3.5" strokeWidth={2.5} />
                Terminé
            </span>
        );
    }
    if (status === 'in_progress') {
        return <span className="bg-brand w-fit rounded-full px-3 py-1 text-xs font-semibold text-white">En cours</span>;
    }
    return <span className="w-fit rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-600">À faire</span>;
}

/* Décorations en haut à droite des cartes (aria-hidden : purement visuelles) */

function Plate() {
    return (
        <span aria-hidden className="absolute top-3 right-3 size-10 rounded-full bg-white">
            <span className="absolute top-2.5 left-2 size-3.5 rounded-full bg-[#f57aae]" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-[#ffd24d]" />
            <span className="absolute right-2 bottom-2 size-3 rounded-full bg-[#5dc28c]" />
        </span>
    );
}

function Star() {
    return (
        <svg aria-hidden viewBox="0 0 24 24" className="absolute top-3 right-3 size-10 fill-[#ffd24d]">
            <path d="M12 1.5l3.1 6.9 7.4.7-5.6 5 1.6 7.4L12 17.7l-6.5 3.8 1.6-7.4-5.6-5 7.4-.7z" />
        </svg>
    );
}

function Cloud() {
    return (
        <svg aria-hidden viewBox="0 0 64 30" className="absolute top-5 right-2 w-17 fill-white">
            <path d="M8 30a8 8 0 0 1 0-16 11 11 0 0 1 20-5 10 10 0 0 1 17 3 9 9 0 0 1 11 2 8 8 0 0 1 0 16z" />
        </svg>
    );
}
