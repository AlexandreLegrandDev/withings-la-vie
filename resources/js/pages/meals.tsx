import { KitchenScale } from '@/components/kitchen-scale';
import { MealCard } from '@/components/meal-card';
import MobileLayout from '@/layouts/mobile-layout';
import { mealTypes, type MealSummary, type MealType } from '@/lib/meals';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

interface MealsProps {
    /** Repas du jour déjà commencés, dans l'ordre de la journée (MealController@index). */
    meals: MealSummary[];
    /** Part prévue des besoins du jour pour chaque type de repas, en %. */
    shares: Record<MealType, number>;
}

/** Page Repas : une carte par repas du jour. On peut ajouter plusieurs collations. */
export default function Meals({ meals, shares }: MealsProps) {
    const snacks = meals.filter((meal) => meal.type === 'snack');

    // Repas existants à leur place dans la journée ; une carte « À faire » pour chaque type pas encore commencé
    const cards = mealTypes.flatMap((type): (MealSummary | { type: MealType; todo: true })[] => {
        const existing = meals.filter((meal) => meal.type === type);
        return existing.length > 0 ? existing : [{ type, todo: true }];
    });

    return (
        <MobileLayout title="Repas">
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">Nouveau repas</p>
            <h1 className="mt-2 text-[clamp(1.75rem,8vw,2.1rem)] leading-tight font-semibold tracking-tight">
                Qu'est-ce qu'on
                <span className="font-display text-periwinkle block font-normal">mange ?</span>
            </h1>

            {/* Chaque carte ouvre la page du repas (/repas/{id}), en le créant au premier clic */}
            <div className="stagger mt-6 grid grid-cols-2 gap-3">
                {cards.map((card) =>
                    'todo' in card ? (
                        <MealCard key={card.type} type={card.type} status="todo" share={shares[card.type]} dayPercent={null} mealId={null} />
                    ) : (
                        <MealCard
                            key={card.id}
                            type={card.type}
                            number={card.number}
                            status={card.status}
                            share={card.share}
                            dayPercent={card.dayPercent}
                            mealId={card.id}
                        />
                    ),
                )}
            </div>

            {/* Une collation de plus : la part des collations est alors partagée entre elles */}
            {snacks.length > 0 && (
                <Link
                    href={route('meals.store')}
                    method="post"
                    data={{ type: 'snack', new: true }}
                    as="button"
                    className="border-border text-subtle hover:bg-muted mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed text-sm font-semibold transition active:scale-[0.98]"
                >
                    <Plus className="size-4" />
                    Ajouter une collation
                </Link>
            )}

            <section className="mt-5" aria-label="Balance de cuisine">
                <KitchenScale returnTo="meals" />
            </section>
        </MobileLayout>
    );
}
