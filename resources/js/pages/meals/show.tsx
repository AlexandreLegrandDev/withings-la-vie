import { AnimatedNumber } from '@/components/animated-number';
import { AuthInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { StatusBadge } from '@/components/meal-card';
import { ProgressRing } from '@/components/progress-ring';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { formatLongDay, formatNumber } from '@/lib/format';
import { mealLabel, type MealType } from '@/lib/meals';
import { cn } from '@/lib/utils';
import type { FoodSuggestion, MealIntake, NutrientIntake } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, ChevronLeft, Leaf, Pencil, Plus, Scale, X } from 'lucide-react';
import { useState } from 'react';

interface MealItem {
    id: number;
    food_key: string | null;
    food_name: string;
    /** Poids en grammes (décimal envoyé en texte par Laravel, ex. « 150.00 »). */
    weight_g: string;
}

interface MealShowProps {
    /** Le repas affiché, envoyé par MealController@show. */
    meal: {
        id: number;
        type: MealType;
        /** Numéro quand il y a plusieurs collations ce jour-là, null sinon. */
        number: number | null;
        /** Jour du repas, au format AAAA-MM-JJ. */
        date: string;
        isToday: boolean;
        finished_at: string | null;
        /** Part prévue des besoins du jour pour ce repas, en %. */
        share: number;
    };
    /** Apports du repas comparés à sa part prévue (anneaux) et part réelle de la journée (dayPercent). */
    intake: MealIntake;
    /** Nutriments les moins couverts de la journée : « du fer », « de la B12 ». */
    dayMissing: string[];
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

/** Page d'un repas (/repas/{id}). Un repas terminé reste modifiable avec le bouton « Modifier ». */
export default function MealShow({ meal, intake, dayMissing, items, suggestions }: MealShowProps) {
    const label = mealLabel(meal.type, meal.number);
    const finished = meal.finished_at !== null;
    const [editing, setEditing] = useState(false);
    // Un repas en cours se remplit librement ; un repas terminé seulement après « Modifier »
    const editable = !finished || editing;

    return (
        <MobileLayout title={label}>
            <header className="flex items-center justify-between gap-3">
                <Link
                    // Repas d'un autre jour : on revient au bilan de ce jour (ouvert depuis la page Suivi)
                    href={meal.isToday ? route('meals') : route('today.summary', { date: meal.date })}
                    aria-label="Retour"
                    className="border-border flex size-11 shrink-0 items-center justify-center rounded-full border"
                >
                    <ChevronLeft className="size-5" />
                </Link>
                {!finished ? (
                    <Link
                        href={route('meals.finish', meal.id)}
                        method="post"
                        as="button"
                        className="border-foreground flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium"
                    >
                        <Check className="size-4" />
                        Terminer
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => setEditing((value) => !value)}
                        aria-pressed={editing}
                        className={
                            editing
                                ? 'bg-ink text-ink-foreground flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium'
                                : 'border-foreground flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium'
                        }
                    >
                        {editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
                        {editing ? 'Valider' : 'Modifier'}
                    </button>
                )}
            </header>

            <div className="mt-5 flex items-center gap-2">
                <StatusBadge status={finished ? 'done' : 'in_progress'} />
                {!meal.isToday && <span className="text-muted-foreground text-sm first-letter:uppercase">{formatLongDay(meal.date)}</span>}
            </div>
            <h1 className="mt-2 text-[clamp(1.75rem,8vw,2.1rem)] leading-tight font-semibold tracking-tight">{label}</h1>
            <p className="text-subtle mt-1 text-sm">
                Ce repas couvre{' '}
                <span className="text-foreground font-semibold">
                    <AnimatedNumber value={intake.dayPercent} /> %
                </span>{' '}
                de ta journée <span className="text-muted-foreground">(prévu : {formatNumber(meal.share)} %)</span>
            </p>

            {/* Un anneau par nutriment : part de ce que ce repas devrait apporter (sa part prévue de la journée) */}
            <ul className="stagger mt-4 grid grid-cols-5 gap-2">
                {intake.nutrients.map((nutrient) => {
                    const over = nutrient.actualPercent > 100;
                    return (
                        <li key={nutrient.key} className="flex flex-col items-center gap-1">
                            <ProgressRing
                                percent={nutrient.percent}
                                over={over}
                                className="size-[clamp(3rem,14vw,3.75rem)]"
                                trackClassName="stroke-rose-soft fill-none"
                                strokeWidth={12}
                                label={`${nutrient.label} : ${nutrient.actualPercent} % de l'objectif du repas`}
                            >
                                <span className={over ? 'text-rose-ink text-xs font-bold' : 'text-subtle text-xs font-semibold'}>
                                    {nutrient.actualPercent}
                                </span>
                            </ProgressRing>
                            <span className="text-subtle text-xs">{shortLabels[nutrient.key]}</span>
                        </li>
                    );
                })}
            </ul>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                En % de l’objectif de ce repas
                {intake.nutrients.some((n) => n.actualPercent > 100) && ' · au-delà de 100, l’objectif est dépassé'}.
                {intake.hasUnknownNutrients && ' Certains apports sont inconnus : seules les valeurs du catalogue sont comptées.'}
            </p>

            <section className="mt-6">
                <h2 className="text-base font-bold">Dans l'assiette</h2>
                {items.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-sm">Aucun aliment pour l'instant.</p>
                ) : (
                    <ul className="stagger mt-2 flex flex-col gap-2">
                        {items.map((item) => (
                            <PlateItem key={item.id} mealId={meal.id} item={item} editable={editable} />
                        ))}
                    </ul>
                )}
                {editable && items.length > 0 && <p className="text-muted-foreground mt-2 text-xs">Touche un aliment pour corriger son poids.</p>}
            </section>

            {editable && (
                <Link
                    href={route('meals.items.create', meal.id)}
                    className="bg-ink text-ink-foreground mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-medium"
                >
                    <Plus className="size-4" />
                    Ajouter un aliment
                </Link>
            )}

            {editable && <SuggestionsCard mealId={meal.id} dayMissing={dayMissing} suggestions={suggestions} />}
        </MobileLayout>
    );
}

/** Carte jaune « Pour compléter ta journée », avec des aliments qui comblent les manques du jour. */
function SuggestionsCard({ mealId, dayMissing, suggestions }: { mealId: number; dayMissing: string[]; suggestions: FoodSuggestion[] }) {
    return (
        <section className="bg-sun mt-5 rounded-3xl p-4">
            <div className="flex items-center gap-3">
                <span className="bg-card flex size-10 shrink-0 items-center justify-center rounded-full">
                    <Leaf className="text-mint-ink size-5" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-base font-bold">Pour compléter ta journée</h2>
                    <p className="text-sun-ink text-sm">
                        {dayMissing.length > 0 ? `Il te manque surtout ${dayMissing.join(' et ')}` : 'Tes besoins du jour sont couverts, bravo !'}
                    </p>
                </div>
            </div>

            {suggestions.length > 0 && (
                <ul className="stagger mt-3 flex flex-col gap-2">
                    {suggestions.map((suggestion) => (
                        <li key={suggestion.key} className="bg-card flex items-center gap-3 rounded-2xl px-3 py-2.5">
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-sm font-semibold">
                                    <span className="truncate">{suggestion.name}</span>
                                    {suggestion.badge && (
                                        <span className="bg-rose-soft text-rose-ink shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
                                            {suggestion.badge}
                                        </span>
                                    )}
                                </p>
                                <p className="text-muted-foreground truncate text-xs">
                                    {formatNumber(suggestion.weight_g)} g · {suggestion.benefits}
                                </p>
                            </div>
                            {/* Ouvre « Choisir un aliment » avec cet aliment déjà choisi, prêt à être pesé */}
                            <Link
                                href={route('meals.items.create', { meal: mealId, aliment: suggestion.key })}
                                className="bg-ink text-ink-foreground flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                            >
                                <Scale className="size-4" aria-hidden="true" />
                                Peser
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function PlateItem({ mealId, item, editable }: { mealId: number; item: MealItem; editable: boolean }) {
    const [removing, setRemoving] = useState(false);
    const [editingWeight, setEditingWeight] = useState(false);

    const remove = () =>
        router.delete(route('meals.items.destroy', [mealId, item.id]), {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setRemoving(true),
            onSuccess: () => router.flushAll(),
            onFinish: () => setRemoving(false),
        });

    const content = (
        <>
            <span aria-hidden className="bg-mint size-10 shrink-0 rounded-xl" />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.food_name}</span>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    {formatNumber(item.weight_g)} g{editable && <Pencil className="size-3" aria-hidden="true" />}
                </span>
            </span>
        </>
    );

    return (
        <li className={cn('flex items-center gap-2 transition-[opacity,transform] duration-200', removing && 'scale-95 opacity-40')}>
            {editable ? (
                <button
                    type="button"
                    onClick={() => setEditingWeight(true)}
                    aria-label={`Modifier le poids de ${item.food_name}`}
                    className="hover:bg-muted -mx-1 flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 py-1 text-left"
                >
                    {content}
                </button>
            ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3 py-1">{content}</div>
            )}
            {editable && (
                <button
                    type="button"
                    onClick={remove}
                    disabled={removing}
                    aria-label={`Retirer ${item.food_name}`}
                    className="text-faint hover:bg-muted hover:text-foreground flex size-10 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
                >
                    <X className="size-4" />
                </button>
            )}
            <WeightDialog mealId={mealId} item={item} open={editingWeight} onOpenChange={setEditingWeight} />
        </li>
    );
}

/** Fenêtre pour corriger le poids d'un aliment déjà dans l'assiette. */
function WeightDialog({
    mealId,
    item,
    open,
    onOpenChange,
}: {
    mealId: number;
    item: MealItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({ weight_g: String(Number(item.weight_g)) });

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (processing) return;
                if (!nextOpen) {
                    reset();
                    clearErrors();
                }
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent>
                <DialogTitle className="pr-8 leading-snug">{item.food_name}</DialogTitle>
                <DialogDescription>Corrige le poids : les apports du repas et de ta journée sont recalculés.</DialogDescription>
                <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        patch(route('meals.items.update', [mealId, item.id]), {
                            preserveScroll: true,
                            // Garde le mode « Modifier » ouvert
                            preserveState: true,
                            onSuccess: () => {
                                router.flushAll();
                                onOpenChange(false);
                            },
                        });
                    }}
                >
                    <div className="grid gap-2">
                        <label htmlFor={`weight-${item.id}`} className="pl-4 text-sm font-medium">
                            Poids (g)
                        </label>
                        <AuthInput
                            id={`weight-${item.id}`}
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            max="5000"
                            step="0.01"
                            required
                            value={data.weight_g}
                            onChange={(e) => setData('weight_g', e.target.value)}
                        />
                        <InputError message={errors.weight_g} className="pl-4" />
                    </div>
                    <Button type="submit" disabled={processing} className="bg-ink text-ink-foreground hover:bg-ink/90 h-12 rounded-full text-base">
                        {processing ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
