import { Star, StatusBadge } from '@/components/meal-card';
import MobileLayout from '@/layouts/mobile-layout';
import { formatLongDay, formatNumber, plural } from '@/lib/format';
import { mealLabel, type MealSummary } from '@/lib/meals';
import { cn } from '@/lib/utils';
import type { Intake, NutrientIntake } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DaySummaryProps {
    /** Jour affiché, AAAA-MM-JJ (aujourd'hui, ou un jour passé ouvert depuis la page Suivi). */
    date: string;
    isToday: boolean;
    /** Bilan du jour calculé par app/Services/DailyIntake.php (TodayController@summary). */
    intake: Intake;
    /** Repas de ce jour, avec la part de la journée que chacun a apportée. */
    meals: MealSummary[];
}

/** Titre selon le nombre d'objectifs manqués : 0 manqué → « Journée parfaite. », 1 → « Presque parfait. »… */
const headlines: [string, string][] = [
    ['Journée', 'parfaite.'],
    ['Presque', 'parfait.'],
    ['Bien', 'joué.'],
    ['En bonne', 'voie.'],
    ['Tout reste', 'à jouer.'],
];

/** Conseil pour le nutriment le plus en retard (idées végétariennes). */
const tips: Record<NutrientIntake['key'], string> = {
    protein: 'Pense aux protéines : des lentilles, des pois chiches, du tofu ou un yaourt.',
    iron: 'Pense au fer : des lentilles, du tofu ou des pois chiches, avec un fruit riche en vitamine C pour mieux l’absorber.',
    b12: 'Pense à la B12 : un œuf, un yaourt, ou 80 g de jambon végétal La Vie.',
    calcium: 'Pense au calcium : un yaourt, un morceau de fromage ou une boisson végétale enrichie.',
    zinc: 'Pense au zinc : des graines de courge, des pois chiches ou un peu de fromage.',
};

/** Badge à droite de chaque nutriment. Au-delà de 100 %, on affiche le dépassement. */
function Status({ nutrient }: { nutrient: NutrientIntake }) {
    const [label, className] =
        nutrient.actualPercent > 100
            ? [`Dépassé · ${nutrient.actualPercent} %`, 'bg-rose-soft text-rose-ink']
            : nutrient.percent >= 100
              ? ['Atteint', 'bg-mint text-mint-ink']
              : nutrient.percent >= 50
                ? [`Partiel · ${nutrient.percent} %`, 'bg-sun text-sun-ink']
                : ['À compléter', 'bg-rose-soft text-rose-ink'];

    return <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', className)}>{label}</span>;
}

/** Page « Bilan de la journée » (/bilan ou /bilan?date=AAAA-MM-JJ). */
export default function DaySummary({ date, isToday, intake, meals }: DaySummaryProps) {
    const total = intake.nutrients.length;
    const reached = intake.nutrients.filter((n) => n.percent >= 100).length;
    const [first, second] = headlines[Math.min(total - reached, headlines.length - 1)];

    // Atteints d'abord, puis du plus avancé au moins avancé (comme sur la maquette)
    const sorted = [...intake.nutrients].sort((a, b) => b.percent - a.percent);
    // Le nutriment le plus en retard, pour le conseil « Pour ton prochain repas »
    const weakest = sorted.at(-1);
    const backHref = isToday ? route('today') : route('tracking', { date });

    return (
        <MobileLayout title="Bilan de la journée">
            <header className="relative">
                {!isToday && (
                    <Link
                        href={backHref}
                        aria-label="Retour au suivi"
                        className="border-border mb-4 flex size-11 items-center justify-center rounded-full border"
                    >
                        <ChevronLeft className="size-5" />
                    </Link>
                )}
                {/* Étoile dans un rond rose, en haut à droite */}
                <span aria-hidden className="bg-rose absolute top-0 right-0 flex size-20 items-center justify-center rounded-full">
                    <Star className="size-10" />
                </span>

                <p className="text-muted-foreground relative pt-4 text-xs font-medium tracking-widest uppercase">
                    {isToday ? 'Bilan de la journée' : formatLongDay(date)}
                </p>
                <h1 className="relative mt-1 text-[clamp(2rem,9vw,2.5rem)] leading-[1.05] font-semibold tracking-tight">
                    {first}
                    <span className="font-display text-mint-ink block font-normal">{second}</span>
                </h1>
                <p className="text-subtle relative mt-1 text-sm">
                    {reached} {plural(reached, 'objectif atteint', 'objectifs atteints')} sur {total}
                </p>
            </header>

            <ul className="stagger divide-border mt-6 divide-y">
                {sorted.map((nutrient) => (
                    <li key={nutrient.key} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                            <p className="font-semibold">{nutrient.label}</p>
                            <p className="text-muted-foreground text-sm tabular-nums">
                                {formatNumber(nutrient.eaten)} / {formatNumber(nutrient.target)} {nutrient.unit}
                            </p>
                        </div>
                        <Status nutrient={nutrient} />
                    </li>
                ))}
            </ul>

            {isToday && weakest && weakest.percent < 100 && (
                <section className="bg-sun mt-5 rounded-3xl p-5">
                    <p className="text-sun-ink text-xs font-medium tracking-widest uppercase">Pour ton prochain repas</p>
                    <p className="mt-2 text-lg leading-snug font-bold">{tips[weakest.key]}</p>
                </section>
            )}

            <section className="mt-6">
                <h2 className="text-base font-bold">{isToday ? 'Tes repas du jour' : 'Tes repas ce jour-là'}</h2>
                {meals.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-sm">Aucun repas noté.</p>
                ) : (
                    <ul className="stagger mt-2 flex flex-col gap-2">
                        {meals.map((meal) => (
                            <li key={meal.id}>
                                <Link
                                    href={route('meals.show', meal.id)}
                                    className="border-border hover:bg-muted flex items-center gap-3 rounded-2xl border px-4 py-3"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold">{mealLabel(meal.type, meal.number)}</span>
                                        <span className="text-muted-foreground block text-sm">{meal.dayPercent} % de la journée</span>
                                    </span>
                                    <StatusBadge status={meal.status} />
                                    <ChevronRight className="text-faint size-4 shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
                La B12 est quasi absente des végétaux. Ce suivi ne remplace pas un bilan sanguin : parles-en à un professionnel de santé pour savoir
                s'il te faut un complément.
            </p>

            <Link
                href={backHref}
                className="bg-ink text-ink-foreground mt-8 flex h-14 w-full items-center justify-center rounded-full text-base font-medium"
            >
                {isToday ? 'Retour à ma journée' : 'Retour au suivi'}
            </Link>
        </MobileLayout>
    );
}
