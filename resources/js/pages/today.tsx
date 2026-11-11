import { mealLabels, type MealType } from '@/components/meal-card';
import MobileLayout from '@/layouts/mobile-layout';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

interface Nutrient {
    key: string;
    label: string;
    unit: string;
    eaten: number;
    target: number;
    /** Part du besoin déjà couverte, de 0 à 100. */
    percent: number;
}

interface TodayProps {
    /** Jour affiché, au format AAAA-MM-JJ. */
    date: string;
    /** Bilan du jour calculé par app/Services/DailyIntake.php. */
    intake: {
        percent: number;
        nutrients: Nutrient[];
        /** Les nutriments les plus en retard, déjà avec leur article : ["du fer", "de la B12"]. */
        missing: string[];
    };
    /** Repas du jour commencé et pas encore terminé, ou null. */
    currentMeal: { id: number; type: MealType; items_count: number } | null;
}

/** Nombre à la française, 1 décimale max : 7,4 / 520 / 31. */
const formatNumber = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

export default function Today({ date, intake, currentMeal }: TodayProps) {
    // L'utilisateur connecté est partagé avec toutes les pages (HandleInertiaRequests.php) ; « name » contient le prénom
    const { auth } = usePage<SharedData>().props;

    // « lundi 9 novembre » ; T12:00 évite qu'un décalage de fuseau fasse afficher la veille
    const day = new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        // La page prend toute la hauteur de l'écran (h-dvh, pb-28 = place du menu) : les espaces <Gap /> se partagent
        // la hauteur libre, pour que tout tienne sans scroller sur un petit téléphone et respire sur un grand.
        <MobileLayout title="Aujourd'hui" className="flex min-h-dvh flex-col pt-[clamp(1rem,3vh,2rem)] pb-28">
            <header className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[0.7rem] font-medium tracking-widest text-neutral-500 uppercase">{day}</p>
                    <h1 className="truncate text-[clamp(1.6rem,7.5vw,2rem)] leading-tight font-semibold tracking-tight">
                        Salut <span className="font-display text-brand font-normal">{auth.user.name}</span>
                    </h1>
                </div>
                <Link
                    href={route('profile')}
                    aria-label="Mon profil"
                    className="bg-sun flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold uppercase"
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
                <ul className="mt-2 flex flex-1 flex-col justify-evenly gap-[clamp(0.5rem,1.6vh,1rem)]">
                    {intake.nutrients.map((nutrient) => (
                        <NutrientBar key={nutrient.key} nutrient={nutrient} />
                    ))}
                </ul>

                <p className="mt-2 text-[0.7rem] text-neutral-500">mesuré par Withings</p>
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

/** Carte rose du haut : anneau d'avancement + message. */
function DayCard({ percent, missing }: { percent: number; missing: string[] }) {
    return (
        <section className="relative flex shrink-0 items-center gap-4 overflow-hidden rounded-3xl bg-[#ffd9e8] p-[clamp(0.75rem,2vh,1rem)]">
            {/* Rond décoratif en bas à droite, comme sur la maquette */}
            <span aria-hidden className="absolute -right-6 -bottom-10 size-28 rounded-full bg-[#ffc2da]" />

            <ProgressRing percent={percent} />

            <div className="relative min-w-0">
                <p className="text-[0.7rem] font-medium tracking-widest text-[#cc7499] uppercase">Ta journée</p>
                <p className="mt-0.5 text-lg leading-tight font-bold">{headline(percent)}</p>
                <p className="mt-1 text-sm leading-snug text-[#b34d7a]">{missingSentence(missing)}</p>
            </div>
        </section>
    );
}

/** Anneau de progression en SVG (le trait rose fait percent % du tour). */
function ProgressRing({ percent }: { percent: number }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    return (
        // Taille du rond : suit la hauteur de l'écran, entre 80 et 112 px
        <div className="relative size-[clamp(5rem,13vh,7rem)] shrink-0" role="img" aria-label={`${percent} % des besoins du jour`}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="white" stroke="white" strokeWidth="10" />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - percent / 100)}
                    className="transition-[stroke-dashoffset] duration-700"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[clamp(1.25rem,3.4vh,1.5rem)] leading-none font-semibold">{percent}%</span>
                <span className="mt-0.5 text-[0.65rem] text-neutral-500">du jour</span>
            </div>
        </div>
    );
}

function NutrientBar({ nutrient }: { nutrient: Nutrient }) {
    return (
        <li>
            <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{nutrient.label}</span>
                <span className="text-neutral-600">
                    {formatNumber(nutrient.eaten)} / {formatNumber(nutrient.target)} {nutrient.unit}
                </span>
            </div>
            <div
                className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100"
                role="progressbar"
                aria-label={nutrient.label}
                aria-valuenow={nutrient.percent}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div className="h-full rounded-full bg-[#f57aae] transition-[width] duration-700" style={{ width: `${nutrient.percent}%` }} />
            </div>
        </li>
    );
}

/** Raccourci vers le repas en cours, ou vers la page Repas s'il n'y en a pas. */
function MealShortcut({ meal }: { meal: TodayProps['currentMeal'] }) {
    const title = meal ? `${mealLabels[meal.type]} en cours` : 'Ajouter un repas';
    const subtitle = meal
        ? meal.items_count > 0
            ? `${meal.items_count} aliment${meal.items_count > 1 ? 's' : ''} pesé${meal.items_count > 1 ? 's' : ''}`
            : 'Aucun aliment pesé'
        : 'Pèse ton prochain repas';

    return (
        <Link
            href={meal ? route('meals.show', meal.id) : route('meals')}
            className="flex shrink-0 items-center gap-3 rounded-3xl border border-neutral-200 px-4 py-[clamp(0.625rem,1.8vh,1rem)] transition active:scale-[0.98]"
        >
            {/* Petite assiette, comme sur la carte du déjeuner */}
            <span aria-hidden className="bg-sun relative size-11 shrink-0 rounded-full">
                <span className="absolute top-3.5 left-3 size-3 rounded-full bg-[#f57aae]" />
                <span className="absolute top-3 right-3.5 size-2 rounded-full bg-[#ffd24d] ring-2 ring-white" />
                <span className="absolute right-3.5 bottom-3 size-2.5 rounded-full bg-[#5dc28c]" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-bold">{title}</span>
                <span className="block text-sm text-neutral-500">{subtitle}</span>
            </span>
            <span className="bg-night flex size-10 shrink-0 items-center justify-center rounded-full text-white">
                <ChevronRight className="size-5" />
            </span>
        </Link>
    );
}
