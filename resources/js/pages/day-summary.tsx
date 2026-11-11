import MobileLayout from '@/layouts/mobile-layout';
import { cn } from '@/lib/utils';
import type { Intake, NutrientIntake } from '@/types';
import { Link } from '@inertiajs/react';

interface DaySummaryProps {
    /** Bilan du jour calculé par app/Services/DailyIntake.php (TodayController@summary). */
    intake: Intake;
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
    b12: 'Pense à la B12 : un œuf, un yaourt, ou 80 g de jambon Équilibre La Vie.',
    calcium: 'Pense au calcium : un yaourt, un morceau de fromage ou une boisson végétale enrichie.',
    zinc: 'Pense au zinc : des graines de courge, des pois chiches ou un peu de fromage.',
};

/** Badge à droite de chaque nutriment. */
function Status({ percent }: { percent: number }) {
    const [label, className] =
        percent >= 100
            ? ['Atteint', 'bg-[#e0f5e9] text-[#3f8f63]']
            : percent >= 50
              ? [`Partiel · ${percent} %`, 'bg-sun text-[#8a6d00]']
              : ['À compléter', 'bg-[#ffe0ec] text-brand'];

    return <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold', className)}>{label}</span>;
}

/** Nombre à la française, 1 décimale max : 28,5 / 230. */
const formatNumber = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Page « Bilan de la journée » (/bilan), ouverte depuis la carte « Ta journée » de l'accueil. */
export default function DaySummary({ intake }: DaySummaryProps) {
    const total = intake.nutrients.length;
    const reached = intake.nutrients.filter((n) => n.percent >= 100).length;
    const [first, second] = headlines[Math.min(total - reached, headlines.length - 1)];

    // Atteints d'abord, puis du plus avancé au moins avancé (comme sur la maquette)
    const sorted = [...intake.nutrients].sort((a, b) => b.percent - a.percent);
    // Le nutriment le plus en retard, pour le conseil « Pour ton prochain repas »
    const weakest = sorted.at(-1);

    return (
        <MobileLayout title="Bilan de la journée">
            <header className="relative">
                {/* Étoile dans un rond rose, en haut à droite */}
                <span aria-hidden className="absolute top-0 right-0 flex size-20 items-center justify-center rounded-full bg-[#ffd9e8]">
                    <svg viewBox="0 0 24 24" className="size-10 fill-[#ffd24d]">
                        <path d="M12 1.5l3.1 6.9 7.4.7-5.6 5 1.6 7.4L12 17.7l-6.5 3.8 1.6-7.4-5.6-5 7.4-.7z" />
                    </svg>
                </span>

                <p className="relative pt-4 text-[0.7rem] font-medium tracking-widest text-neutral-500 uppercase">Bilan de la journée</p>
                <h1 className="relative mt-1 text-[clamp(2rem,9vw,2.5rem)] leading-[1.05] font-semibold tracking-tight">
                    {first}
                    <span className="font-display block font-normal text-[#3f8f63]">{second}</span>
                </h1>
                <p className="relative mt-1 text-sm text-neutral-600">
                    {reached} objectif{reached > 1 ? 's' : ''} atteint{reached > 1 ? 's' : ''} sur {total}
                </p>
            </header>

            <ul className="mt-6 divide-y divide-neutral-100">
                {sorted.map((nutrient) => (
                    <li key={nutrient.key} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                            <p className="font-semibold">{nutrient.label}</p>
                            <p className="text-xs text-neutral-500">
                                {formatNumber(nutrient.eaten)} / {formatNumber(nutrient.target)} {nutrient.unit}
                            </p>
                        </div>
                        <Status percent={nutrient.percent} />
                    </li>
                ))}
            </ul>

            {weakest && weakest.percent < 100 && (
                <section className="bg-sun mt-5 rounded-3xl p-5">
                    <p className="text-[0.7rem] font-medium tracking-widest text-[#8a6d00] uppercase">Pour ton prochain repas</p>
                    <p className="mt-2 text-lg leading-snug font-bold">{tips[weakest.key]}</p>
                </section>
            )}

            <p className="mt-5 text-xs leading-relaxed text-neutral-500">
                La B12 est quasi absente des végétaux. Ce suivi ne remplace pas un bilan sanguin : parles-en à un professionnel de santé pour savoir
                s'il te faut un complément.
            </p>

            <Link
                href={route('today')}
                className="bg-night mt-8 flex h-14 w-full items-center justify-center rounded-full text-base font-medium text-white"
            >
                Retour à ma journée
            </Link>
        </MobileLayout>
    );
}
