import { AuthInput } from '@/components/auth-input';
import { IngredientNutrients } from '@/components/ingredient-nutrients';
import { IngredientWeighing } from '@/components/ingredient-weighing';
import InputError from '@/components/input-error';
import { mealLabels, type MealType } from '@/components/meal-card';
import { Button } from '@/components/ui/button';
import { useKitchenScale } from '@/contexts/kitchen-scale-context';
import MobileLayout from '@/layouts/mobile-layout';
import { cn } from '@/lib/utils';
import type { Food, FoodSuggestion } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, ScanLine, Search, X } from 'lucide-react';
import { useState, type FormEventHandler } from 'react';

interface AddFoodProps {
    /** Repas dans lequel on ajoute l'aliment (MealItemController@create). */
    meal: { id: number; type: MealType };
    /** Aliments proposés pour ce repas : vide tant que l'API des aliments n'est pas branchée. */
    suggestions: FoodSuggestion[];
    /** Liste issue de resources/data/catalogue-aliments.json. */
    foods: Food[];
}

type Filter = 'all' | Food['category'];

const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'la_vie', label: 'Produits La Vie' },
    { value: 'base', label: 'Aliments de base' },
];

/** Couleurs des cartes et pastilles, prises à tour de rôle (relevées sur la maquette). */
const colors = ['bg-[#ffd9e8]', 'bg-sun', 'bg-[#d9ecfa]', 'bg-[#e0f5e9]'];

/** Recherche sans tenir compte des majuscules ni des accents : « pates » trouve « Pâtes ». */
const normalize = (text: string) =>
    text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();

/** Page « Choisir un aliment » (/repas/{id}/ingredients/ajouter). */
export default function AddFood({ meal, suggestions, foods }: AddFoodProps) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [visibleCount, setVisibleCount] = useState(15);
    // Aliment choisi : on demande alors son poids avant de l'ajouter
    const [selected, setSelected] = useState<string | null>(null);

    const visibleFoods = foods.filter((food) => (filter === 'all' || food.category === filter) && normalize(food.name).includes(normalize(query)));
    // Si l'aliment tapé n'est pas dans le catalogue, on propose de l'ajouter tel quel
    const exactMatch = foods.some((food) => normalize(food.name) === normalize(query));

    return (
        <MobileLayout title="Choisir un aliment">
            <header className="flex items-center gap-3">
                <Link
                    href={route('meals.show', meal.id)}
                    aria-label="Retour au repas"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-200"
                >
                    <ChevronLeft className="size-5" />
                </Link>
                <h1 className="text-[clamp(1.5rem,7vw,1.85rem)] leading-tight font-semibold tracking-tight">
                    Choisir un <span className="font-display text-brand font-normal">aliment</span>
                </h1>
            </header>

            {selected !== null ? (
                <WeightForm key={selected} mealId={meal.id} foodName={selected} onCancel={() => setSelected(null)} />
            ) : (
                <>
                    <div className="mt-5 flex items-center gap-3">
                        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-neutral-100 px-4">
                            <Search className="size-4 shrink-0 text-neutral-400" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setVisibleCount(15);
                                }}
                                placeholder="Lentilles, tofu, jambon…"
                                aria-label="Rechercher un aliment"
                                maxLength={255}
                                // text-base : en dessous de 16 px, Safari sur iPhone zoome sur le champ
                                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400"
                            />
                        </label>
                        {/* Scan du code-barres : pas encore disponible */}
                        <button
                            type="button"
                            disabled
                            aria-label="Scanner un code-barres (bientôt disponible)"
                            className="bg-night flex size-12 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
                        >
                            <ScanLine className="size-5" />
                        </button>
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrer les aliments">
                        {filters.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setFilter(value);
                                    setVisibleCount(15);
                                }}
                                aria-pressed={filter === value}
                                className={cn(
                                    'shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                                    filter === value
                                        ? 'bg-night text-white'
                                        : value === 'la_vie'
                                          ? 'text-brand bg-[#ffd9e8]'
                                          : 'bg-neutral-100 text-neutral-700',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {suggestions.length > 0 && (
                        <section className="mt-5">
                            <h2 className="text-sm font-bold">Suggérés pour ton {mealLabels[meal.type].toLowerCase()}</h2>
                            {/* Cartes qui défilent à l'horizontale ; -mx-4 px-4 : elles vont jusqu'au bord de l'écran */}
                            <ul className="-mx-4 mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                                {suggestions.map((suggestion, index) => (
                                    <li key={suggestion.name} className="snap-start">
                                        <button
                                            type="button"
                                            onClick={() => setSelected(suggestion.name)}
                                            className={cn(
                                                'flex h-28 w-28 flex-col items-center justify-center rounded-2xl p-2 text-center',
                                                colors[index % colors.length],
                                            )}
                                        >
                                            <span className="text-sm leading-tight font-bold">{suggestion.name}</span>
                                            <span className="mt-1 text-[0.65rem] text-neutral-600">
                                                {suggestion.weight_g} g · {suggestion.benefits}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="mt-5">
                        <h2 className="text-sm font-bold">Tous les aliments</h2>
                        <p className="mt-1 text-xs text-neutral-500">
                            {visibleFoods.length} aliment{visibleFoods.length !== 1 ? 's' : ''} trouvé{visibleFoods.length !== 1 ? 's' : ''}
                        </p>

                        <ul className="mt-1 divide-y divide-neutral-100">
                            {visibleFoods.slice(0, visibleCount).map((food, index) => (
                                <li key={food.key}>
                                    <FoodRow food={food} color={colors[index % colors.length]} onSelect={() => setSelected(food.name)} />
                                </li>
                            ))}

                            {/* Aliment tapé absent du catalogue : on peut l'ajouter à la main */}
                            {query.trim() !== '' && !exactMatch && (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => setSelected(query.trim())}
                                        className="flex w-full items-center gap-3 py-3 text-left"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                                            <Plus className="size-4" />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium">Ajouter « {query.trim()} »</span>
                                        <ChevronRight className="size-4 shrink-0 text-neutral-400" />
                                    </button>
                                </li>
                            )}
                        </ul>

                        {visibleFoods.length > visibleCount && (
                            <button
                                type="button"
                                onClick={() => setVisibleCount((count) => count + 15)}
                                className="mt-4 w-full rounded-full border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
                            >
                                Afficher plus d’aliments
                            </button>
                        )}

                        {foods.length === 0 && query.trim() === '' && (
                            <p className="mt-2 text-sm text-neutral-500">Le catalogue arrive bientôt. En attendant, tape le nom de ton aliment.</p>
                        )}
                    </section>
                </>
            )}
        </MobileLayout>
    );
}

function FoodRow({ food, color, onSelect }: { food: Food; color: string; onSelect: () => void }) {
    return (
        <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 py-3 text-left">
            <span aria-hidden className={cn('size-10 shrink-0 rounded-xl', color)} />
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{food.name}</span>
                    {food.badge && (
                        <span className="text-brand shrink-0 rounded-full bg-[#ffe0ec] px-1.5 py-0.5 text-[0.6rem] font-semibold">{food.badge}</span>
                    )}
                </span>
                {food.nutrients && <span className="block truncate text-xs text-neutral-500">{food.nutrients}</span>}
            </span>
            <ChevronRight className="size-4 shrink-0 text-neutral-400" />
        </button>
    );
}

/** Étape 2 : le poids de l'aliment choisi (saisi à la main tant que la balance n'est pas branchée). */
function WeightForm({ mealId, foodName, onCancel }: { mealId: number; foodName: string; onCancel: () => void }) {
    const { connected } = useKitchenScale();
    const [weighing, setWeighing] = useState(false);
    const { data, setData, post, processing, errors } = useForm({ food_name: foodName, weight_g: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (processing) return;
        // Le serveur renvoie ensuite sur la page du repas
        post(route('meals.items.store', mealId));
    };

    return (
        <>
            <form onSubmit={submit} className="mt-6 flex flex-col">
                <div className="flex items-center gap-3 rounded-3xl bg-[#e0f5e9] p-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[0.7rem] font-medium tracking-widest text-neutral-500 uppercase">Aliment choisi</p>
                        <p className="truncate text-lg font-bold">{foodName}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Changer d'aliment"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <InputError message={errors.food_name} className="mt-2 pl-4" />

                <div className="mt-5 grid gap-2">
                    <label htmlFor="weight_g" className="pl-4 text-sm font-medium">
                        Poids (g)
                    </label>
                    <AuthInput
                        id="weight_g"
                        type="number"
                        inputMode="decimal"
                        min="1"
                        max="5000"
                        step="any"
                        required
                        autoFocus
                        value={data.weight_g}
                        onChange={(e) => setData('weight_g', e.target.value)}
                        placeholder="150"
                    />
                    <InputError message={errors.weight_g} className="pl-4" />
                </div>

                <div className="mt-5">
                    <IngredientNutrients />
                </div>

                {connected && (
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() => setWeighing(true)}
                        className="mt-6 mb-4 self-start text-sm text-black underline underline-offset-4 disabled:opacity-50"
                    >
                        Peser avec la balance
                    </button>
                )}

                <Button
                    type="submit"
                    disabled={processing}
                    className={cn('bg-night hover:bg-night/90 h-14 w-full rounded-full text-base text-white', !connected && 'mt-6')}
                >
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Ajouter dans l'assiette
                </Button>
            </form>
            <IngredientWeighing
                mealId={mealId}
                foodName={foodName}
                open={weighing}
                onClose={() => setWeighing(false)}
                onManual={(weight) => {
                    setData('weight_g', weight);
                    setWeighing(false);
                }}
            />
        </>
    );
}
