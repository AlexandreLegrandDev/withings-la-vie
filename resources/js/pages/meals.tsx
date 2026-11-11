import { KitchenScale } from '@/components/kitchen-scale';
import { MealCard, type MealStatus, type MealType } from '@/components/meal-card';
import MobileLayout from '@/layouts/mobile-layout';

/** Les 4 repas de la journée, dans l'ordre d'affichage, avec leur part des apports du jour. */
const dayMeals: { type: MealType; share: number }[] = [
    { type: 'breakfast', share: 25 },
    { type: 'lunch', share: 35 },
    { type: 'snack', share: 10 },
    { type: 'dinner', share: 30 },
];

type MealDates = {
    created_at: string | null;
    finished_at: string | null;
};

export function getMealStatus(meal: MealDates): MealStatus {
    if (meal.finished_at) return 'done';
    if (meal.created_at) return 'in_progress';
    return 'todo';
}

interface MealsProps {
    /** Id en base du repas du jour pour chaque type, null s'il n'est pas encore créé (envoyé par MealController@index). */
    mealIds: Record<MealType, number | null>;
    mealDates: Record<MealType, MealDates>;
}

export default function Meals({ mealIds, mealDates }: MealsProps) {
    return (
        <MobileLayout title="Repas">
            <p className="text-xs font-medium tracking-widest text-neutral-500 uppercase">Nouveau repas</p>
            <h1 className="mt-2 text-[clamp(1.75rem,8vw,2.1rem)] leading-tight font-semibold tracking-tight">
                Qu'est-ce qu'on
                <span className="font-display text-periwinkle block font-normal">mange ?</span>
            </h1>

            {/* Chaque carte ouvre la page du repas du jour (/repas/{id}), en le créant au premier clic */}
            <div className="mt-6 grid grid-cols-2 gap-3">
                {dayMeals.map(({ type, share }) => (
                    <MealCard key={type} type={type} share={share} status={getMealStatus(mealDates[type])} mealId={mealIds[type]} />
                ))}
            </div>

            <section className="mt-5" aria-label="Balance de cuisine">
                <KitchenScale returnTo="meals" />
            </section>
        </MobileLayout>
    );
}
