import { AuthInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { mealLabels, type MealType } from '@/components/meal-card';
import { ProgressRing } from '@/components/progress-ring';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import MobileLayout from '@/layouts/mobile-layout';
import type { Intake, NutrientIntake } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, ChevronLeft, Leaf, LoaderCircle, Plus, X } from 'lucide-react';
import { useState, type FormEventHandler } from 'react';

interface MealItem {
    id: number;
    food_name: string;
    /** Poids en grammes (décimal envoyé en texte par Laravel, ex. « 150.00 »). */
    weight_g: string;
}

/**
 * Aliment proposé pour combler les manques du repas.
 * Format prévu pour l'API des aliments : MealController@show renvoie une liste vide en attendant.
 */
export interface FoodSuggestion {
    name: string;
    /** Poids conseillé, en grammes. */
    weight_g: number;
    /** Ce que l'aliment apporte, déjà rédigé : « +15 g prot. · +200 mg Ca ». */
    benefits: string;
    /** Badge rose à côté du nom (ex. une marque partenaire), facultatif. */
    badge?: string;
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

            {!finished && <AddFoodDialog mealId={meal.id} />}
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

/** Bouton « Ajouter un aliment » et sa fenêtre : nom + poids (saisis à la main tant que la balance n'est pas branchée). */
function AddFoodDialog({ mealId }: { mealId: number }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ food_name: '', weight_g: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('meals.items.store', mealId), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                if (!value) clearErrors();
            }}
        >
            <DialogTrigger asChild>
                <Button className="bg-night hover:bg-night/90 mt-6 h-14 w-full rounded-full text-base text-white">
                    <Plus className="size-4" />
                    Ajouter un aliment
                </Button>
            </DialogTrigger>

            {/* Fenêtre qui monte du bas de l'écran, comme une feuille d'appli mobile */}
            <DialogContent className="top-auto bottom-0 max-w-md translate-y-0 gap-0 rounded-t-3xl rounded-b-none border-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <DialogTitle className="text-xl font-bold">Ajouter un aliment</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-neutral-500">Indique ce que tu ajoutes dans ton assiette.</DialogDescription>

                <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="food_name" className="pl-4">
                            Aliment
                        </Label>
                        <AuthInput
                            id="food_name"
                            required
                            maxLength={100}
                            value={data.food_name}
                            onChange={(e) => setData('food_name', e.target.value)}
                            placeholder="Lentilles cuites"
                        />
                        <InputError message={errors.food_name} className="pl-4" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="weight_g" className="pl-4">
                            Poids (g)
                        </Label>
                        <AuthInput
                            id="weight_g"
                            type="number"
                            inputMode="decimal"
                            min="1"
                            max="5000"
                            step="any"
                            required
                            value={data.weight_g}
                            onChange={(e) => setData('weight_g', e.target.value)}
                            placeholder="150"
                        />
                        <InputError message={errors.weight_g} className="pl-4" />
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-brand hover:bg-brand/90 mt-2 h-14 w-full rounded-full text-base text-white"
                    >
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        Ajouter
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
