import { AnimatedNumber } from '@/components/animated-number';
import { Plate } from '@/components/meal-card';
import { NutrientBar } from '@/components/nutrient-bar';
import { ProgressRing } from '@/components/progress-ring';
import MobileLayout from '@/layouts/mobile-layout';
import { formatLongDay, plural } from '@/lib/format';
import { mealLabel, type MealType } from '@/lib/meals';
import type { Intake, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

interface TodayProps {
    /** Jour affiché, au format AAAA-MM-JJ. */
    date: string;
    /** Bilan du jour calculé par app/Services/DailyIntake.php. */
    intake: Intake;
    /** Repas du jour commencé et pas encore terminé, ou null. */
    currentMeal: { id: number; type: MealType; number: number | null; items_count: number } | null;
}

export default function Today({ date, intake, currentMeal }: TodayProps) {
    // L'utilisateur connecté est partagé avec toutes les pages (HandleInertiaRequests.php) ; « name » contient le prénom
    const { auth } = usePage<SharedData>().props;

    return (
        // La page prend toute la hauteur de l'écran (pb-28 = place du menu) : les espaces <Gap /> se partagent
        // la hauteur libre, pour que tout tienne sans scroller sur un petit téléphone et respire sur un grand.
        <MobileLayout title="Aujourd'hui" className="flex min-h-dvh flex-col pt-[clamp(1rem,3vh,2rem)] pb-28">
            <header className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">{formatLongDay(date)}</p>
                    <h1 className="truncate text-[clamp(1.6rem,7.5vw,2rem)] leading-tight font-semibold tracking-tight">
                        Salut <span className="font-display text-brand font-normal">{auth.user.name}</span>
                    </h1>
                </div>
                <Link
                    href={route('profile')}
                    aria-label="Mon profil"
                    className="bg-sun text-sun-ink flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold uppercase"
                >
                    {auth.user.name.charAt(0)}
                </Link>
            </header>

            <Gap />
            <DayCard percent={intake.percent} missing={intake.missing} />
            <Gap />

            {/* grow-[2] : la liste des apports prend plus d'espace libre que les autres blocs, pour écarter ses barres */}
            <section className="flex max-h-[26rem] grow-[2] flex-col">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-bold">Tes apports</h2>
                    <Link href={route('tracking')} className="text-sm font-medium underline underline-offset-2">
                        Voir le suivi
                    </Link>
                </div>

                {/* justify-evenly : les barres se répartissent dans la hauteur disponible */}
                <ul className="stagger mt-2 flex flex-1 flex-col justify-evenly gap-[clamp(0.5rem,1.6vh,1rem)]">
                    {intake.nutrients.map(({ key, ...nutrient }) => (
                        <NutrientBar key={key} {...nutrient} />
                    ))}
                </ul>

                <p className="text-muted-foreground mt-2 text-xs">Mesuré par Withings</p>
            </section>

            <Gap />
            <MealShortcut meal={currentMeal} />
        </MobileLayout>
    );
}

/** Espace entre deux blocs : au moins 12 px, s'agrandit avec la place libre, jusqu'à 40 px. */
function Gap() {
    return <div aria-hidden className="max-h-10 min-h-3 flex-1" />;
}

/** Message principal de la carte, selon l'avancement du jour. */
function headline(percent: number) {
    if (percent >= 100) return 'Objectifs atteints !';
    if (percent >= 75) return 'Presque !';
    if (percent >= 40) return 'Bien parti !';
    if (percent > 0) return "C'est parti !";
    return 'Ta journée commence';
}

/** Phrase sous le titre : « Il te manque surtout du fer et de la B12. » */
function missingSentence(missing: string[]) {
    if (missing.length === 0) return 'Tous tes besoins du jour sont couverts, bravo.';
    return `Il te manque surtout ${missing.join(' et ')}.`;
}

/** Carte rose du haut : anneau d'avancement + message. Ouvre le bilan de la journée. */
function DayCard({ percent, missing }: { percent: number; missing: string[] }) {
    return (
        <Link
            href={route('today.summary')}
            prefetch
            className="bg-rose relative flex shrink-0 items-center gap-4 overflow-hidden rounded-3xl p-[clamp(0.75rem,2vh,1rem)] transition active:scale-[0.98]"
        >
            {/* Rond décoratif en bas à droite, comme sur la maquette */}
            <span aria-hidden className="bg-rose-deep absolute -right-6 -bottom-10 size-28 rounded-full" />

            {/* Taille du rond : suit la hauteur de l'écran, entre 80 et 112 px */}
            <ProgressRing percent={percent} className="size-[clamp(5rem,13vh,7rem)]" label={`${percent} % des besoins du jour`}>
                <span className="text-[clamp(1.25rem,3.4vh,1.5rem)] leading-none font-semibold">
                    <AnimatedNumber value={percent} />%
                </span>
                <span className="text-muted-foreground mt-0.5 text-xs">du jour</span>
            </ProgressRing>

            <div className="relative min-w-0">
                <p className="text-rose-ink text-xs font-medium tracking-widest uppercase">Ta journée</p>
                <p className="mt-0.5 text-lg leading-tight font-bold">{headline(percent)}</p>
                <p className="text-rose-ink mt-1 text-sm leading-snug">{missingSentence(missing)}</p>
                <p className="text-rose-ink mt-1.5 flex items-center gap-0.5 text-xs font-semibold">
                    Voir le bilan de ta journée
                    <ChevronRight className="size-3.5 shrink-0" />
                </p>
            </div>
        </Link>
    );
}

/** Raccourci vers le repas en cours, ou vers la page Repas s'il n'y en a pas. */
function MealShortcut({ meal }: { meal: TodayProps['currentMeal'] }) {
    const title = meal ? `${mealLabel(meal.type, meal.number)} en cours` : 'Ajouter un repas';
    const subtitle = meal
        ? meal.items_count > 0
            ? `${meal.items_count} ${plural(meal.items_count, 'aliment pesé', 'aliments pesés')}`
            : 'Aucun aliment pesé'
        : 'Pèse ton prochain repas';

    return (
        <Link
            href={meal ? route('meals.show', meal.id) : route('meals')}
            className="border-border flex shrink-0 items-center gap-3 rounded-3xl border px-4 py-[clamp(0.625rem,1.8vh,1rem)] transition active:scale-[0.98]"
        >
            {/* Petite assiette, comme sur la carte du déjeuner */}
            <span aria-hidden className="bg-sun relative size-11 shrink-0 rounded-full">
                <Plate className="top-0.5 right-0.5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-bold">{title}</span>
                <span className="text-muted-foreground block text-sm">{subtitle}</span>
            </span>
            <span className="bg-ink text-ink-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                <ChevronRight className="size-5" />
            </span>
        </Link>
    );
}
