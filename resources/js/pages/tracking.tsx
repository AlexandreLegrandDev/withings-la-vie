import MobileLayout from '@/layouts/mobile-layout';
import { cn } from '@/lib/utils';
import type { NutrientIntake } from '@/types';
import { Link } from '@inertiajs/react';

interface Bar {
    /** « L », « M »… (semaine) ou « 3–9 » (mois). */
    label: string;
    /** Couverture des besoins en %, null pour un jour ou une semaine pas encore commencés. */
    value: number | null;
    /** Jour (ou semaine) en cours : barre rose foncé. */
    current: boolean;
}

interface TrackingProps {
    period: 'week' | 'month';
    /** Début et fin de la période, AAAA-MM-JJ. */
    start: string;
    end: string;
    bars: Bar[];
    /** Couverture moyenne sur les jours passés de la période, null si aucun. */
    average: number | null;
    /** Moyenne de chaque nutriment, du mieux couvert au moins couvert. */
    nutrients: { key: NutrientIntake['key']; label: string; percent: number }[];
    /** Jours d'affilée avec au moins un aliment enregistré. */
    streak: number;
}

/** T12:00 évite qu'un décalage de fuseau fasse afficher la veille. */
const toDate = (date: string) => new Date(`${date}T12:00:00`);

/** « 2 – 8 novembre », « 27 octobre – 2 novembre » ou « novembre 2026 ». */
function periodLabel(period: TrackingProps['period'], start: string, end: string) {
    const from = toDate(start);
    const to = toDate(end);
    if (period === 'month') return from.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const sameMonth = from.getMonth() === to.getMonth();
    const first = sameMonth ? String(from.getDate()) : from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return `${first} – ${to.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

/** Page « Ton suivi » (/suivi, ou /suivi?periode=mois). Données envoyées par TrackingController. */
export default function Tracking({ period, start, end, bars, average, nutrients, streak }: TrackingProps) {
    const b12 = nutrients.find((n) => n.key === 'b12');

    return (
        <MobileLayout title="Suivi">
            <p className="text-[0.7rem] font-medium tracking-widest text-neutral-500 uppercase">{periodLabel(period, start, end)}</p>
            <h1 className="text-[clamp(1.75rem,8vw,2.1rem)] leading-tight font-semibold tracking-tight">
                Ton <span className="font-display font-normal text-[#f2c230]">suivi</span>
            </h1>

            <PeriodSwitch period={period} />

            <section className="mt-5">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-bold">Couverture des apports</h2>
                    <span className="text-sm text-neutral-600">moy. {average ?? '–'} %</span>
                </div>
                <CoverageChart bars={bars} />
            </section>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <StreakCard streak={streak} />
                {b12 && <B12Card percent={b12.percent} />}
            </div>

            <section className="mt-5">
                <h2 className="text-base font-bold">Moyenne par nutriment</h2>
                <ul className="mt-2 flex flex-col gap-3">
                    {nutrients.map((nutrient) => (
                        <li key={nutrient.key}>
                            <div className="flex items-baseline justify-between text-sm">
                                <span className="font-medium">{nutrient.label}</span>
                                <span className="text-neutral-600">{nutrient.percent} %</span>
                            </div>
                            <div
                                className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100"
                                role="progressbar"
                                aria-label={nutrient.label}
                                aria-valuenow={nutrient.percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-[width] duration-700',
                                        // Bien couvert (90 % et plus) : vert
                                        nutrient.percent >= 90 ? 'bg-[#5dc28c]' : 'bg-[#f57aae]',
                                    )}
                                    style={{ width: `${nutrient.percent}%` }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </MobileLayout>
    );
}

/** Bascule Semaine / Mois : change l'URL (?periode=mois) pour que le serveur renvoie la bonne période. */
function PeriodSwitch({ period }: { period: TrackingProps['period'] }) {
    const options = [
        { value: 'week', label: 'Semaine', href: route('tracking') },
        { value: 'month', label: 'Mois', href: route('tracking', { periode: 'mois' }) },
    ] as const;

    return (
        <div className="mt-4 grid grid-cols-2 rounded-full bg-neutral-100 p-1">
            {options.map((option) => (
                <Link
                    key={option.value}
                    href={option.href}
                    preserveScroll
                    replace
                    aria-current={period === option.value ? 'page' : undefined}
                    className={cn(
                        'rounded-full py-2.5 text-center text-sm font-medium transition-colors',
                        period === option.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500',
                    )}
                >
                    {option.label}
                </Link>
            ))}
        </div>
    );
}

/** Barres verticales : hauteur = couverture du jour (ou de la semaine), de 0 à 100 %. */
function CoverageChart({ bars }: { bars: Bar[] }) {
    return (
        <ul className="mt-3 flex gap-[3%]">
            {bars.map((bar, index) => (
                <li key={index} className="flex min-w-0 flex-1 flex-col items-center">
                    <span className={cn('h-4 text-xs text-neutral-600', bar.current && 'font-bold text-neutral-900')}>{bar.value ?? ''}</span>
                    {/* Zone de 160 px : la barre part du bas */}
                    <div className="mt-1 flex h-40 w-full items-end">
                        <div
                            className={cn(
                                'w-full rounded-xl transition-[height] duration-700',
                                bar.value === null ? 'border-2 border-dashed border-neutral-200' : bar.current ? 'bg-brand' : 'bg-[#ffd9e8]',
                            )}
                            // Au moins 6 % pour qu'une barre à 0 reste visible ; jour à venir : contour en pointillé
                            style={{ height: `${bar.value === null ? 100 : Math.max(6, bar.value)}%` }}
                            role="img"
                            aria-label={bar.value === null ? `${bar.label} : à venir` : `${bar.label} : ${bar.value} %`}
                        />
                    </div>
                    <span className={cn('mt-2 text-xs whitespace-nowrap text-neutral-500', bar.current && 'font-bold text-neutral-900')}>
                        {bar.label}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function StreakCard({ streak }: { streak: number }) {
    const message = streak === 0 ? 'jour suivi : commence ta série !' : streak === 1 ? 'jour suivi, continue !' : "suivis d'affilée, continue !";

    return (
        <section className="relative rounded-3xl bg-[#e0f5e9] p-4">
            <svg aria-hidden viewBox="0 0 24 24" className="absolute top-3 right-3 size-7 fill-[#ffd24d]">
                <path d="M12 1.5l3.1 6.9 7.4.7-5.6 5 1.6 7.4L12 17.7l-6.5 3.8 1.6-7.4-5.6-5 7.4-.7z" />
            </svg>
            <p className="text-3xl font-semibold">{streak} j</p>
            <p className="mt-2 text-sm leading-snug text-[#3f8f63]">{message}</p>
        </section>
    );
}

function B12Card({ percent }: { percent: number }) {
    const verdict = percent >= 100 ? 'bien couverte' : percent >= 50 ? 'presque !' : 'à surveiller';

    return (
        <section className="rounded-3xl bg-[#ffd9e8] p-4">
            <p className="text-3xl font-semibold">{percent} %</p>
            <p className="text-brand mt-2 text-sm leading-snug">de B12 en moyenne : {verdict}</p>
        </section>
    );
}
