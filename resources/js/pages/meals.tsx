import { MealCard, type MealStatus, type MealType } from '@/components/meal-card';
import MobileLayout from '@/layouts/mobile-layout';

/** Les 4 repas de la journée, dans l'ordre d'affichage, avec leur part des apports du jour. */
const dayMeals: { type: MealType; share: number }[] = [
    { type: 'breakfast', share: 25 },
    { type: 'lunch', share: 35 },
    { type: 'snack', share: 10 },
    { type: 'dinner', share: 30 },
];

export default function Meals() {
    // État de chaque repas, en dur pour l'instant (comme sur la maquette).
    // À calculer plus tard, par ex. : « done » si le repas a un finished_at, « in_progress » s'il a commencé, sinon « todo ».
    const statuses: Record<MealType, MealStatus> = {
        breakfast: 'done',
        lunch: 'in_progress',
        snack: 'todo',
        dinner: 'todo',
    };

    return (
        <MobileLayout title="Repas">
            <p className="text-xs font-medium tracking-widest text-neutral-500 uppercase">Nouveau repas</p>
            <h1 className="mt-2 text-[clamp(1.75rem,8vw,2.1rem)] leading-tight font-semibold tracking-tight">
                Qu'est-ce qu'on
                <span className="font-display text-periwinkle block font-normal">mange ?</span>
            </h1>

            {/* Les cartes n'ont pas encore de page : on ajoutera href={...} quand elles existeront */}
            <div className="mt-6 grid grid-cols-2 gap-3">
                {dayMeals.map(({ type, share }) => (
                    <MealCard key={type} type={type} share={share} status={statuses[type]} />
                ))}
            </div>

            {/* Balance : affichage en dur, non cliquable pour l'instant */}
            <section className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f4f4f6] px-4 py-3.5">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-[#5dc28c] ring-4 ring-[#5dc28c]/20" />
                <div>
                    <p className="text-sm font-semibold">Balance Withings connectée</p>
                    <p className="text-xs text-neutral-500">Prête à peser ton premier aliment</p>
                </div>
            </section>
        </MobileLayout>
    );
}
