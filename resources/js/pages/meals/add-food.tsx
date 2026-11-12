import { AuthInput } from '@/components/auth-input';
import { foodNutrients, IngredientNutrients } from '@/components/ingredient-nutrients';
import { IngredientWeighing } from '@/components/ingredient-weighing';
import InputError from '@/components/input-error';
import { KitchenScale } from '@/components/kitchen-scale';
import { Button } from '@/components/ui/button';
import { useKitchenScale } from '@/contexts/kitchen-scale-context';
import MobileLayout from '@/layouts/mobile-layout';
import { formatNumber, plural } from '@/lib/format';
import { mealLabels, type MealType } from '@/lib/meals';
import { cn } from '@/lib/utils';
import type { Food, FoodSuggestion } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { Bluetooth, ChevronLeft, ChevronRight, LoaderCircle, Plus, Scale, Search, X } from 'lucide-react';
import { useState, type FormEventHandler } from 'react';

interface AddFoodProps {
    /** Repas dans lequel on ajoute l'aliment (MealItemController@create). */
    meal: { id: number; type: MealType };
    /** Aliments qui comblent les manques de la journée (app/Services/FoodSuggester.php). */
    suggestions: FoodSuggestion[];
    /** Liste issue de resources/data/catalogue-aliments.json. */
    foods: Food[];
    /** Clé d'un aliment déjà choisi (bouton « Peser » d'une suggestion), ou null. */
    preselected: string | null;
}

/** Aliment choisi : un aliment du catalogue (key) ou un nom tapé à la main (key null). */
type Selection = { key: string | null; name: string };

type Filter = 'all' | Food['category'];

const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'la_vie', label: 'Produits La Vie' },
    { value: 'base', label: 'Aliments de base' },
];

/** Couleurs des cartes et pastilles, prises à tour de rôle (relevées sur la maquette). */
const colors = ['bg-rose', 'bg-sun', 'bg-sky', 'bg-mint'];

const PAGE_SIZE = 15;

/** Recherche sans tenir compte des majuscules ni des accents : « pates » trouve « Pâtes ». */
const normalize = (text: string) =>
    text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();

/** « 14 g prot. · 3 mg fer » : les deux apports les plus importants pour 100 g, par rapport à des repères du jour. */
const DAILY_REFERENCE: Record<string, number> = { protein_g: 60, iron_mg: 11, zinc_mg: 11, calcium_mg: 950, b12_ug: 4 };
function highlights(food: Food) {
    return foodNutrients
        .filter(({ key }) => (food.per100g[key] ?? 0) > 0)
        .sort((a, b) => (food.per100g[b.key] ?? 0) / DAILY_REFERENCE[b.key] - (food.per100g[a.key] ?? 0) / DAILY_REFERENCE[a.key])
        .slice(0, 2)
        .map(({ key, short, unit }) => `${formatNumber(food.per100g[key] ?? 0)} ${unit} ${short}`)
        .join(' · ');
}

/** Page « Choisir un aliment » (/repas/{id}/ingredients/ajouter). */
export default function AddFood({ meal, suggestions, foods, preselected }: AddFoodProps) {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [selected, setSelected] = useState<Selection | null>(() => {
        const food = foods.find((f) => f.key === preselected);
        return food ? { key: food.key, name: food.name } : null;
    });

    const visibleFoods = foods.filter((food) => (filter === 'all' || food.category === filter) && normalize(food.name).includes(normalize(query)));
    // Si l'aliment tapé n'est pas dans le catalogue, on propose de l'ajouter tel quel
    const exactMatch = foods.some((food) => normalize(food.name) === normalize(query));

    const updateQuery = (value: string) => {
        setQuery(value);
        setVisibleCount(PAGE_SIZE);
    };

    return (
        <MobileLayout title="Choisir un aliment">
            <header className="flex items-center gap-3">
                <Link
                    href={route('meals.show', meal.id)}
                    aria-label="Retour au repas"
                    className="border-border flex size-11 shrink-0 items-center justify-center rounded-full border"
                >
                    <ChevronLeft className="size-5" />
                </Link>
                <h1 className="text-[clamp(1.5rem,7vw,1.85rem)] leading-tight font-semibold tracking-tight">
                    Choisir un <span className="font-display text-brand font-normal">aliment</span>
                </h1>
            </header>

            {selected !== null ? (
                <WeightForm
                    key={selected.key ?? selected.name}
                    mealId={meal.id}
                    foodName={selected.name}
                    food={foods.find((food) => food.key === selected.key)}
                    onCancel={() => setSelected(null)}
                />
            ) : (
                <>
                    <label className="bg-muted mt-5 flex h-12 items-center gap-2 rounded-full px-4">
                        <Search className="text-faint size-4 shrink-0" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => updateQuery(e.target.value)}
                            placeholder="Lentilles, tofu, jambon végétal…"
                            aria-label="Rechercher un aliment"
                            maxLength={255}
                            // text-base : en dessous de 16 px, Safari sur iPhone zoome sur le champ
                            className="placeholder:text-faint min-w-0 flex-1 bg-transparent text-base outline-none"
                        />
                    </label>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrer les aliments">
                        {filters.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => {
                                    setFilter(value);
                                    setVisibleCount(PAGE_SIZE);
                                }}
                                aria-pressed={filter === value}
                                className={cn(
                                    'shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                                    filter === value
                                        ? 'bg-ink text-ink-foreground'
                                        : value === 'la_vie'
                                          ? 'bg-rose text-rose-ink'
                                          : 'bg-muted text-subtle',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {suggestions.length > 0 && query === '' && (
                        <section className="mt-5">
                            <h2 className="text-base font-bold">Suggérés pour ton {mealLabels[meal.type].toLowerCase()}</h2>
                            <p className="text-muted-foreground text-sm">Ce qui manque le plus à ta journée</p>
                            {/* Cartes qui défilent à l'horizontale ; -mx-4 px-4 : elles vont jusqu'au bord de l'écran */}
                            <ul className="-mx-4 mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                                {suggestions.map((suggestion, index) => (
                                    <li key={suggestion.key} className="snap-start">
                                        <button
                                            type="button"
                                            onClick={() => setSelected({ key: suggestion.key, name: suggestion.name })}
                                            className={cn(
                                                'flex h-32 w-36 flex-col justify-between rounded-2xl p-3 text-left',
                                                colors[index % colors.length],
                                            )}
                                        >
                                            <span className="line-clamp-3 text-sm leading-tight font-bold">{suggestion.name}</span>
                                            <span className="text-subtle text-xs leading-snug">
                                                {suggestion.weight_g} g · {suggestion.benefits}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="mt-5">
                        <h2 className="text-base font-bold">Tous les aliments</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {visibleFoods.length} {plural(visibleFoods.length, 'aliment trouvé', 'aliments trouvés')}
                        </p>

                        <ul className="divide-border mt-1 divide-y">
                            {visibleFoods.slice(0, visibleCount).map((food, index) => (
                                <li key={food.key}>
                                    <FoodRow
                                        food={food}
                                        color={colors[index % colors.length]}
                                        onSelect={() => setSelected({ key: food.key, name: food.name })}
                                    />
                                </li>
                            ))}

                            {/* Aliment tapé absent du catalogue : on peut l'ajouter à la main */}
                            {query.trim() !== '' && !exactMatch && (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => setSelected({ key: null, name: query.trim() })}
                                        className="flex w-full items-center gap-3 py-3 text-left"
                                    >
                                        <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
                                            <Plus className="size-4" />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium">Ajouter « {query.trim()} »</span>
                                        <ChevronRight className="text-faint size-4 shrink-0" />
                                    </button>
                                </li>
                            )}
                        </ul>

                        {visibleFoods.length > visibleCount && (
                            <button
                                type="button"
                                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                                className="border-border hover:bg-muted mt-4 w-full rounded-full border px-4 py-3 text-sm font-medium"
                            >
                                Afficher plus d’aliments
                            </button>
                        )}
                    </section>
                </>
            )}
        </MobileLayout>
    );
}

function FoodRow({ food, color, onSelect }: { food: Food; color: string; onSelect: () => void }) {
    const summary = highlights(food);

    return (
        <button type="button" onClick={onSelect} className="flex w-full items-center gap-3 py-3 text-left">
            <span aria-hidden className={cn('size-10 shrink-0 rounded-xl', color)} />
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{food.name}</span>
                    {food.badge && (
                        <span className="bg-rose-soft text-rose-ink shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">{food.badge}</span>
                    )}
                </span>
                {summary && <span className="text-muted-foreground block truncate text-xs">{summary} /100 g</span>}
            </span>
            <ChevronRight className="text-faint size-4 shrink-0" />
        </button>
    );
}

/** Étape 2 : le poids de l'aliment choisi. La pesée avec la balance Withings est mise en avant. */
function WeightForm({ mealId, foodName, food, onCancel }: { mealId: number; foodName: string; food?: Food; onCancel: () => void }) {
    const { connected } = useKitchenScale();
    const [weighing, setWeighing] = useState(false);
    const { data, setData, post, processing, errors } = useForm({ food_key: food?.key ?? null, food_name: foodName, weight_g: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (processing) return;
        // Le serveur renvoie ensuite sur la page du repas
        post(route('meals.items.store', mealId), { onSuccess: () => router.flushAll() });
    };

    return (
        <>
            <div className="bg-mint mt-6 flex items-center gap-3 rounded-3xl p-4">
                <div className="min-w-0 flex-1">
                    <p className="text-mint-ink text-xs font-medium tracking-widest uppercase">Aliment choisi</p>
                    <p className="text-lg leading-snug font-bold">{foodName}</p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Changer d'aliment"
                    className="bg-card flex size-10 shrink-0 items-center justify-center rounded-full"
                >
                    <X className="size-4" />
                </button>
            </div>
            <InputError message={errors.food_name || errors.food_key} className="mt-2 pl-4" />

            {/* Cœur de la collaboration Withings : la pesée à la balance passe en premier */}
            <section className="bg-sky mt-4 flex items-center gap-4 rounded-3xl p-4">
                <img src="/image/Balance_sansbol.svg" alt="" className="size-20 shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="font-bold">{connected ? 'Pose ton aliment sur la balance' : 'Pèse avec ta balance Withings'}</p>
                    <p className="text-sky-ink mt-0.5 text-sm leading-snug">
                        {connected ? 'Le poids et les apports sont calculés tout seuls.' : 'Connecte-la pour peser sans rien saisir.'}
                    </p>
                </div>
            </section>
            {connected ? (
                <Button
                    type="button"
                    disabled={processing}
                    onClick={() => setWeighing(true)}
                    className="bg-brand hover:bg-brand/90 mt-3 h-14 w-full rounded-full text-base text-white"
                >
                    <Scale aria-hidden="true" />
                    Peser avec la balance
                </Button>
            ) : (
                <KitchenScale
                    returnTo="back"
                    trigger={
                        <Button type="button" className="bg-brand hover:bg-brand/90 mt-3 h-14 w-full rounded-full text-base text-white">
                            <Bluetooth aria-hidden="true" />
                            Connecter ma balance
                        </Button>
                    }
                />
            )}

            <div className="text-muted-foreground my-5 flex items-center gap-3 text-sm" aria-hidden="true">
                <span className="bg-border h-px flex-1" />
                ou saisis le poids
                <span className="bg-border h-px flex-1" />
            </div>

            <form onSubmit={submit} className="flex flex-col">
                <div className="grid gap-2">
                    <label htmlFor="weight_g" className="pl-4 text-sm font-medium">
                        Poids (g)
                    </label>
                    <AuthInput
                        id="weight_g"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="5000"
                        step="0.01"
                        required
                        value={data.weight_g}
                        onChange={(e) => setData('weight_g', e.target.value)}
                        placeholder="150"
                    />
                    <InputError message={errors.weight_g} className="pl-4" />
                </div>

                <div className="mt-5">
                    <IngredientNutrients per100g={food?.per100g} estimated={food?.estimated} weightG={Number(data.weight_g)} />
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="bg-ink text-ink-foreground hover:bg-ink/90 mt-6 h-14 w-full rounded-full text-base"
                >
                    {processing && <LoaderCircle className="animate-spin" />}
                    Ajouter au repas
                </Button>
            </form>

            <IngredientWeighing
                mealId={mealId}
                foodName={foodName}
                food={food}
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
