import { Star } from '@/components/meal-card';
import { NutrientBar } from '@/components/nutrient-bar';
import MobileLayout from '@/layouts/mobile-layout';
import { parseDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { NutrientIntake } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Bar {
    /** « L », « M »… (semaine) ou « 3–9 » (mois). */
    label: string;
    /** Jour (semaine) ou premier jour de la semaine (mois), AAAA-MM-JJ. */
    date: string;
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
    /** Un jour de la période précédente / suivante (null si elle n'a pas commencé). */
    previousDate: string;
    nextDate: string | null;
    bars: Bar[];
    /** Couverture moyenne sur les jours suivis de la période (jours à 0 % exclus), null si aucun. */
    average: number | null;
    /** Moyenne de chaque nutriment sur les jours suivis, du mieux couvert au moins couvert. */
    nutrients: { key: NutrientIntake['key']; label: string; percent: number }[];
    /** Jours d'affilée avec au moins un aliment enregistré. */
    streak: number;
}

/** « 2 – 8 novembre », « 27 octobre – 2 novembre » ou « novembre 2026 ». */
function periodLabel(period: TrackingProps['period'], start: string, end: string) {
    const from = parseDay(start);
    const to = parseDay(end);
    if (period === 'month') return from.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const sameMonth = from.getMonth() === to.getMonth();
    const first = sameMonth ? String(from.getDate()) : from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return `${first} – ${to.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

/** Lien vers la même vue (semaine ou mois) pour un autre jour. */
const periodHref = (period: TrackingProps['period'], date: string) => route('tracking', { ...(period === 'month' && { periode: 'mois' }), date });

/** Page « Ton suivi » (/suivi, ou /suivi?periode=mois, ?date=… pour une période passée). Données envoyées par TrackingController. */
export default function Tracking({ period, start, end, previousDate, nextDate, bars, average, nutrients, streak }: TrackingProps) {
    const b12 = nutrients.find((n) => n.key === 'b12');

    return (
        <MobileLayout title="Suivi">
            <div className="flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">{periodLabel(period, start, end)}</p>
                <nav className="flex gap-1" aria-label="Changer de période">
                    <PeriodArrow href={periodHref(period, previousDate)} label={period === 'week' ? 'Semaine précédente' : 'Mois précédent'}>
                        <ChevronLeft className="size-5" />
                    </PeriodArrow>
                    <PeriodArrow
                        href={nextDate ? periodHref(period, nextDate) : null}
                        label={period === 'week' ? 'Semaine suivante' : 'Mois suivant'}
                    >
                        <ChevronRight className="size-5" />
                    </PeriodArrow>
                </nav>
            </div>
            <h1 className="text-[clamp(1.75rem,8vw,2.1rem)] leading-tight font-semibold tracking-tight">
                Ton <span className="font-display text-gold font-normal">suivi</span>
            </h1>

            <PeriodSwitch period={period} />

            <section className="mt-5">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-bold">Couverture des apports</h2>
                    <span className="text-subtle text-sm">moy. {average ?? '–'} %</span>
                </div>
                <CoverageChart period={period} bars={bars} />
                <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                    {period === 'week' ? 'Touche un jour pour voir son bilan.' : 'Touche une semaine pour voir le détail de ses jours.'} Les jours
                    sans repas noté ne comptent pas dans les moyennes.
                </p>
            </section>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <StreakCard streak={streak} />
                {b12 && <B12Card percent={b12.percent} />}
            </div>

            <section className="mt-5">
                <h2 className="text-base font-bold">Moyenne par nutriment</h2>
                {nutrients.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-sm">Aucun repas noté sur cette période.</p>
                ) : (
                    <ul className="mt-2 flex flex-col gap-3">
                        {nutrients.map((nutrient) => (
                            // Bien couvert (90 % et plus) : vert
                            <NutrientBar key={nutrient.key} label={nutrient.label} percent={nutrient.percent} goodFrom={90} />
                        ))}
                    </ul>
                )}
            </section>
        </MobileLayout>
    );
}

function PeriodArrow({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
    const className = 'border-border flex size-10 items-center justify-center rounded-full border';

    if (href === null) {
        return (
            <span aria-disabled="true" aria-label={label} className={cn(className, 'text-faint opacity-50')}>
                {children}
            </span>
        );
    }

    return (
        <Link href={href} preserveScroll replace aria-label={label} className={cn(className, 'hover:bg-muted')}>
            {children}
        </Link>
    );
}

/** Bascule Semaine / Mois : change l'URL (?periode=mois) pour que le serveur renvoie la bonne période. */
function PeriodSwitch({ period }: { period: TrackingProps['period'] }) {
    const options = [
        { value: 'week', label: 'Semaine', href: route('tracking') },
        { value: 'month', label: 'Mois', href: route('tracking', { periode: 'mois' }) },
    ] as const;

    return (
        <div className="bg-muted mt-4 grid grid-cols-2 rounded-full p-1">
            {options.map((option) => (
                <Link
                    key={option.value}
                    href={option.href}
                    preserveScroll
                    replace
                    aria-current={period === option.value ? 'page' : undefined}
                    className={cn(
                        'rounded-full py-2.5 text-center text-sm font-medium transition-colors',
                        period === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                    )}
                >
                    {option.label}
                </Link>
            ))}
        </div>
    );
}

/**
 * Barres verticales : hauteur = couverture du jour (ou de la semaine), de 0 à 100 %.
 * Un clic ouvre le bilan du jour (vue semaine) ou la semaine (vue mois).
 */
function CoverageChart({ period, bars }: { period: TrackingProps['period']; bars: Bar[] }) {
    return (
        <ul className="mt-3 flex gap-[3%]">
            {bars.map((bar) => {
                const upcoming = bar.value === null;
                const content = (
                    <>
                        <span className={cn('text-subtle h-4 text-xs', bar.current && 'text-foreground font-bold')}>{bar.value ?? ''}</span>
                        {/* Zone de 160 px : la barre part du bas */}
                        <span className="mt-1 flex h-40 w-full items-end">
                            <span
                                className={cn(
                                    'block w-full rounded-xl transition-[height] duration-700',
                                    upcoming ? 'border-border border-2 border-dashed' : bar.current ? 'bg-brand' : 'bg-rose',
                                )}
                                // Au moins 6 % pour qu'une barre à 0 reste visible ; jour à venir : contour en pointillé
                                style={{ height: `${upcoming ? 100 : Math.max(6, bar.value ?? 0)}%` }}
                            />
                        </span>
                        <span className={cn('text-muted-foreground mt-2 text-xs whitespace-nowrap', bar.current && 'text-foreground font-bold')}>
                            {bar.label}
                        </span>
                    </>
                );
                const label = upcoming ? `${bar.label} : à venir` : `${bar.label} : ${bar.value} %`;

                return (
                    <li key={bar.date} className="min-w-0 flex-1">
                        {upcoming ? (
                            <div className="flex flex-col items-center" role="img" aria-label={label}>
                                {content}
                            </div>
                        ) : (
                            <Link
                                href={period === 'week' ? route('today.summary', { date: bar.date }) : periodHref('week', bar.date)}
                                aria-label={period === 'week' ? `${label}, voir le bilan` : `${label}, voir la semaine`}
                                className="flex flex-col items-center rounded-xl transition active:scale-95"
                            >
                                {content}
                            </Link>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function StreakCard({ streak }: { streak: number }) {
    const message = streak === 0 ? 'jour suivi : commence ta série !' : streak === 1 ? 'jour suivi, continue !' : "suivis d'affilée, continue !";

    return (
        <section className="bg-mint relative rounded-3xl p-4">
            <Star className="absolute top-3 right-3 size-7" />
            <p className="text-3xl font-semibold">{streak} j</p>
            <p className="text-mint-ink mt-2 text-sm leading-snug">{message}</p>
        </section>
    );
}

function B12Card({ percent }: { percent: number }) {
    const verdict = percent >= 100 ? 'bien couverte' : percent >= 50 ? 'presque !' : 'à surveiller';

    return (
        <section className="bg-rose rounded-3xl p-4">
            <p className="text-3xl font-semibold">{percent} %</p>
            <p className="text-rose-ink mt-2 text-sm leading-snug">de B12 en moyenne : {verdict}</p>
        </section>
    );
}
