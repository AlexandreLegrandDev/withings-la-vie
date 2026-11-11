import { mealLabels, type MealType } from '@/components/meal-card';
import { ProgressRing } from '@/components/progress-ring';
import MobileLayout from '@/layouts/mobile-layout';
import type { FoodSuggestion, Intake, NutrientIntake } from '@/types';
import { Link, router } from '@inertiajs/react';
import { Check, ChevronLeft, Leaf, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface MealItem {
    id: number;
    food_name: string;
    /** Poids en grammes (décimal envoyé en texte par Laravel, ex. « 150.00 »). */
    weight_g: string;
}

interface MealShowProps {
    /** Le repas affiché, envoyé par MealController@show. */
    meal: {
        id: number;
        type: MealType;
        /** Jour du repas, au format AAAA-MM-JJ. */
        date: string;
        finished_at: string | null;
        /** Part des besoins du jour prévue pour ce repas, en %. */
        share: number;
    };
    /** Apports du repas comparés à sa part des besoins du jour. */
    intake: Intake;
    items: MealItem[];
    suggestions: FoodSuggestion[];
}

/** Nom court sous chaque anneau. */
const shortLabels: Record<NutrientIntake['key'], string> = {
    protein: 'Prot.',
    iron: 'Fer',
    b12: 'B12',
    calcium: 'Calcium',
    zinc: 'Zinc',
};

/** Nombre à la française, 1 décimale max : 150 / 12,5. */
const formatNumber = (value: number | string) => Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Page d'un repas précis (/repas/{id}). L'onglet « Repas » du menu reste allumé, car l'URL commence par /repas. */
export default function MealShow({ meal, intake, items, suggestions }: MealShowProps) {
    const label = mealLabels[meal.type];
    const finished = meal.finished_at !== null;

    return (
        <MobileLayout title={label}>
            <header className="flex items-center justify-between">
                <Link
                    href={route('meals')}
                    aria-label="Retour aux repas"
                    className="flex size-11 items-center justify-center rounded-full border border-neutral-200"
                >
                    <ChevronLeft className="size-5" />
                </Link>
                {!finished && (
                    <Link
                        href={route('meals.finish', meal.id)}
                        method="post"
                        as="button"
                        className="flex h-11 items-center gap-2 rounded-full border border-neutral-900 px-4 text-sm font-medium"
                    >
                        <Check className="size-4" />
                        Terminer
                    </Link>
                )}
            </header>

            <p className="mt-5 text-[0.7rem] font-medium tracking-widest text-neutral-500 uppercase">
                {finished ? 'Terminé' : 'En cours'} · {meal.share} % de ta journée
            </p>
            <h1 className="text-[clamp(1.75rem,8vw,2.1rem)] leading-tight font-semibold tracking-tight">{label}</h1>

            {/* Un anneau par nutriment : part de ce que ce repas devrait apporter */}
            <ul className="mt-4 grid grid-cols-5 gap-2">
                {intake.nutrients.map((nutrient) => (
                    <li key={nutrient.key} className="flex flex-col items-center gap-1">
                        <ProgressRing
                            percent={nutrient.percent}
                            className="size-[clamp(2.75rem,13vw,3.5rem)]"
                            trackClassName="stroke-[#ffe0ec] fill-none"
                            strokeWidth={12}
                            label={`${nutrient.label} : ${nutrient.percent} %`}
                        >
                            <span className="text-xs font-semibold text-neutral-600">{nutrient.percent}</span>
                        </ProgressRing>
                        <span className="text-[0.7rem] text-neutral-600">{shortLabels[nutrient.key]}</span>
                    </li>
                ))}
            </ul>

            {!finished && <SuggestionsCard mealLabel={label} missing={intake.missing} suggestions={suggestions} />}

            <section className="mt-6">
                <h2 className="text-sm font-bold">Dans l'assiette</h2>
                {items.length === 0 ? (
                    <p className="mt-2 text-sm text-neutral-500">Aucun aliment pour l'instant.</p>
                ) : (
                    <ul className="mt-2 flex flex-col gap-2">
                        {items.map((item) => (
                            <PlateItem key={item.id} mealId={meal.id} item={item} canRemove={!finished} />
                        ))}
                    </ul>
                )}
            </section>

            {!finished && (
                <Link
                    href={route('meals.items.create', meal.id)}
                    className="bg-night mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium text-white"
                >
                    <Plus className="size-4" />
                    Ajouter un aliment
                </Link>
            )}
        </MobileLayout>
    );
}

/** Carte jaune « Pour équilibrer ton déjeuner », avec les aliments proposés. */
function SuggestionsCard({ mealLabel, missing, suggestions }: { mealLabel: string; missing: string[]; suggestions: FoodSuggestion[] }) {
    return (
        <section className="bg-sun mt-5 rounded-3xl p-4">
            <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
                    <Leaf className="size-4 text-[#3f8f63]" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-bold">Pour équilibrer ton {mealLabel.toLowerCase()}</h2>
                    <p className="text-xs text-neutral-600">
                        {missing.length > 0 ? `Il manque surtout ${missing.join(' et ')}` : 'Ton repas couvre tous tes besoins, bravo !'}
                    </p>
                </div>
            </div>

            {/* La liste arrivera avec l'API des aliments (MealController@show → « suggestions ») */}
            {suggestions.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                    {suggestions.map((suggestion) => (
                        <SuggestionRow key={suggestion.name} suggestion={suggestion} />
                    ))}
                </ul>
            )}
        </section>
    );
}

function SuggestionRow({ suggestion }: { suggestion: FoodSuggestion }) {
    return (
        <li className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5">
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="truncate">{suggestion.name}</span>
                    {suggestion.badge && (
                        <span className="text-brand shrink-0 rounded-full bg-[#ffe0ec] px-1.5 py-0.5 text-[0.6rem] font-semibold">
                            {suggestion.badge}
                        </span>
                    )}
                </p>
                <p className="truncate text-xs text-neutral-500">
                    {formatNumber(suggestion.weight_g)} g · {suggestion.benefits}
                </p>
            </div>
            {/* « Peser » : lancera la pesée sur la balance Withings */}
            <button type="button" className="bg-night shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white">
                Peser
            </button>
        </li>
    );
}

function PlateItem({ mealId, item, canRemove }: { mealId: number; item: MealItem; canRemove: boolean }) {
    const [removing, setRemoving] = useState(false);

    const remove = () =>
        router.delete(route('meals.items.destroy', [mealId, item.id]), {
            preserveScroll: true,
            onStart: () => setRemoving(true),
            onFinish: () => setRemoving(false),
        });

    return (
        <li className="flex items-center gap-3">
            <span aria-hidden className="size-10 shrink-0 rounded-xl bg-[#e0f5e9]" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.food_name}</p>
                <p className="text-xs text-neutral-500">{formatNumber(item.weight_g)} g</p>
            </div>
            {canRemove && (
                <button
                    type="button"
                    onClick={remove}
                    disabled={removing}
                    aria-label={`Retirer ${item.food_name}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-400 disabled:opacity-50"
                >
                    <X className="size-4" />
                </button>
            )}
        </li>
    );
}
