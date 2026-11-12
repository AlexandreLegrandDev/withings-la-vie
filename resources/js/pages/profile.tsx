import InputError from '@/components/input-error';
import { KitchenScale } from '@/components/kitchen-scale';
import { MeasurementSlider } from '@/components/measurement-slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { formatShortDate as date, formatNumber } from '@/lib/format';
import { dietLabels, sexLabels } from '@/lib/profile';
import { Link, useForm } from '@inertiajs/react';
import { Pencil, Plus, Settings } from 'lucide-react';
import { useState } from 'react';

type WeightEntry = { id: number; weight_kg: number; recorded_at: string };
type ProfileData = {
    name: string;
    sex: string | null;
    diet_status: string | null;
    height_cm: number | null;
    transition_days: number | null;
    protein_target_g: string | null;
    iron_target_mg: string | null;
    b12_target_ug: string | null;
    calcium_target_mg: string | null;
    zinc_target_mg: string | null;
};

const number = (value: number | string) => formatNumber(value, 2);

export default function Profile({ profile, weights }: { profile: ProfileData; weights: WeightEntry[] }) {
    const latest = weights.at(-1);
    const diet = (profile.diet_status && dietLabels[profile.diet_status]) || 'Non renseigné';
    const days = profile.transition_days;
    const subtitle =
        profile.diet_status === 'transition' && days !== null
            ? days === 0
                ? 'Ta transition végé commence !'
                : `En transition végé depuis ${days} jour${days > 1 ? 's' : ''}`
            : profile.diet_status === 'vegetarian'
              ? 'Végétarien au quotidien !'
              : 'Ton profil, à ton rythme';
    const targets = [
        { label: 'Protéines', value: profile.protein_target_g, unit: 'g' },
        { label: 'Fer', value: profile.iron_target_mg, unit: 'mg' },
        { label: 'Vitamine B12', value: profile.b12_target_ug, unit: 'µg' },
        { label: 'Calcium', value: profile.calcium_target_mg, unit: 'mg' },
        { label: 'Zinc', value: profile.zinc_target_mg, unit: 'mg' },
    ];

    return (
        <MobileLayout title="Profil">
            <header className="flex items-center gap-3 pt-4">
                <div
                    className="bg-sun font-display text-brand flex size-14 shrink-0 items-center justify-center rounded-[45%] text-3xl"
                    aria-hidden="true"
                >
                    {Array.from(profile.name.trim())[0]?.toLocaleUpperCase('fr-FR') || '?'}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-semibold tracking-tight">{profile.name}</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{subtitle}</p>
                </div>
                <Link
                    href={route('profile.edit')}
                    aria-label="Paramètres"
                    className="focus-visible:outline-brand hover:bg-muted flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2"
                >
                    <Settings className="size-6" strokeWidth={1.5} />
                </Link>
            </header>

            <dl className="stagger mt-6 grid grid-cols-3 gap-2">
                {[
                    { label: 'Sexe', value: (profile.sex && sexLabels[profile.sex]) || 'Non renseigné' },
                    { label: 'Poids', value: latest ? `${number(latest.weight_kg)} kg` : 'Non renseigné' },
                    { label: 'Régime', value: diet },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-muted relative rounded-[20px] px-3 py-3">
                        <dt className="text-muted-foreground text-xs">{label}</dt>
                        <dd className="mt-0.5 text-sm font-semibold">
                            {value}
                            {label === 'Poids' && (
                                <>
                                    <span className="text-brand mt-1 flex items-center gap-1 text-xs font-normal">
                                        <Pencil className="size-3" aria-hidden="true" />
                                        Modifier
                                    </span>
                                    <WeightEditor currentWeight={latest?.weight_kg} />
                                </>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>

            <section className="mt-6" aria-labelledby="targets-title">
                <h2 id="targets-title" className="text-base font-bold">
                    Tes objectifs par jour
                </h2>
                <dl className="stagger divide-border mt-1 divide-y">
                    {targets.map(({ label, value, unit }) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                            <dt>{label}</dt>
                            <dd className="tabular-nums">{value === null ? 'À renseigner' : `${number(value)} ${unit}`}</dd>
                        </div>
                    ))}
                </dl>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Objectifs estimés selon ton profil (repères ANSES et EFSA). Les protéines suivent ton poids, le calcium ton âge.
                </p>
            </section>

            <section className="mt-5" aria-labelledby="devices-title">
                <h2 id="devices-title" className="mb-2 text-base font-bold">
                    Appareils
                </h2>
                <KitchenScale returnTo="profile" />
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="focus-visible:outline-brand border-faint hover:bg-muted mt-2 flex w-full items-center gap-3 rounded-3xl border border-dashed px-3 py-3 text-left focus-visible:outline-2"
                        >
                            <span className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-2xl">
                                <Plus className="size-5" aria-hidden="true" />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold">Ajouter une balance corporelle</span>
                                <span className="text-muted-foreground block text-xs">Pour suivre aussi ta masse musculaire</span>
                            </span>
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle className="pr-8 leading-snug">Connecter une balance corporelle</DialogTitle>
                        <DialogDescription className="text-subtle">
                            La connexion à un compte Withings sera disponible prochainement. Tes pesées déjà enregistrées restent visibles sur ton
                            profil.
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            </section>

            <WeightHistory weights={weights} />

            <Link
                href={route('logout')}
                method="post"
                as="button"
                className="hover:text-brand text-muted-foreground mx-auto mt-6 block rounded-full px-5 py-2 text-sm underline underline-offset-4"
            >
                Se déconnecter
            </Link>
        </MobileLayout>
    );
}

function WeightEditor({ currentWeight }: { currentWeight?: number }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, clearErrors } = useForm({ weight_kg: String(currentWeight ?? 70) });

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (processing) return;
                if (nextOpen) {
                    setData('weight_kg', String(currentWeight ?? 70));
                    clearErrors();
                }
                setOpen(nextOpen);
            }}
        >
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label="Modifier mon poids"
                    className="hover:bg-brand/5 focus-visible:outline-brand absolute inset-0 rounded-[20px] focus-visible:outline-2"
                />
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Mettre à jour ton poids</DialogTitle>
                <DialogDescription className="text-subtle">
                    Cette pesée est ajoutée à ton historique, et ton objectif de protéines est recalculé.
                </DialogDescription>
                <form
                    className="grid gap-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (processing) return;
                        post(route('profile.weight.store'), {
                            preserveScroll: true,
                            onSuccess: () => setOpen(false),
                        });
                    }}
                >
                    <fieldset disabled={processing} className="grid gap-3">
                        <MeasurementSlider
                            id="profile-weight-slider"
                            label="Poids"
                            value={data.weight_kg}
                            min={30}
                            max={200}
                            step={1}
                            unit="kg"
                            onChange={(value) => setData('weight_kg', value)}
                        />
                        <label htmlFor="profile-weight" className="pl-4 text-sm font-medium">
                            Poids exact (kg)
                        </label>
                        <input
                            id="profile-weight"
                            name="weight_kg"
                            type="number"
                            inputMode="decimal"
                            min="20"
                            max="300"
                            step="0.01"
                            required
                            value={data.weight_kg}
                            onChange={(event) => setData('weight_kg', event.target.value)}
                            aria-invalid={Boolean(errors.weight_kg)}
                            aria-describedby={errors.weight_kg ? 'profile-weight-error' : undefined}
                            className="bg-muted focus-visible:border-brand h-14 w-full rounded-full border-2 border-transparent px-5 text-base outline-none"
                        />
                        <InputError id="profile-weight-error" message={errors.weight_kg} className="pl-4" />
                    </fieldset>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={() => setOpen(false)}
                            className="h-12 flex-1 rounded-full"
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand/90 h-12 flex-1 rounded-full text-white">
                            {processing ? 'Enregistrement…' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function WeightHistory({ weights }: { weights: WeightEntry[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const latest = weights.at(-1);
    const first = weights[0];
    const selected = weights.find((entry) => entry.id === selectedId) ?? latest;
    const difference = latest && first ? latest.weight_kg - first.weight_kg : 0;
    const days = latest && first ? Math.max(0, Math.round((Date.parse(latest.recorded_at) - Date.parse(first.recorded_at)) / 86400000)) : 0;
    const min = weights.length ? Math.min(...weights.map((entry) => entry.weight_kg)) - 0.5 : 0;
    const max = weights.length ? Math.max(...weights.map((entry) => entry.weight_kg)) + 0.5 : 1;
    const start = first ? Date.parse(first.recorded_at) : 0;
    const end = latest ? Date.parse(latest.recorded_at) : 0;
    const points = weights.map((entry, index) => ({
        ...entry,
        x:
            weights.length === 1
                ? 166
                : end === start
                  ? 40 + (index / (weights.length - 1)) * 252
                  : 40 + ((Date.parse(entry.recorded_at) - start) / (end - start)) * 252,
        y: 100 - ((entry.weight_kg - min) / (max - min)) * 72,
    }));
    const line = points.map((point) => `${point.x},${point.y}`).join(' ');

    return (
        <section className="border-border mt-5 overflow-hidden rounded-3xl border p-4" aria-labelledby="weight-title">
            <div className="flex items-center justify-between gap-2">
                <h2 id="weight-title" className="text-base font-bold">
                    Ton poids
                </h2>
                <span className="text-muted-foreground text-xs">Pesées enregistrées</span>
            </div>
            {latest && selected ? (
                <>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-3xl tracking-tight tabular-nums">
                            {number(selected.weight_kg)}
                            <span className="text-muted-foreground ml-1 text-sm">kg</span>
                        </p>
                        {weights.length > 1 && (
                            <p className="bg-mint text-mint-ink rounded-full px-3 py-1.5 text-xs font-medium">
                                {difference > 0 ? '+' : ''}
                                {number(Number(difference.toFixed(2)))} kg · {days >= 7 ? `${Math.floor(days / 7)} sem.` : `${days} j`}
                            </p>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">{date(selected.recorded_at)}</p>
                    <svg
                        viewBox="0 0 320 132"
                        className="mt-2 w-full overflow-visible"
                        role="group"
                        aria-label="Évolution du poids. Sélectionne une pesée pour afficher sa valeur."
                    >
                        {[0, 0.5, 1].map((ratio) => (
                            <g key={ratio}>
                                <line x1="40" x2="292" y1={28 + ratio * 72} y2={28 + ratio * 72} className="stroke-border" />
                                <text x="30" y={31 + ratio * 72} textAnchor="end" fontSize="10" className="fill-muted-foreground">
                                    {number(Number((max - ratio * (max - min)).toFixed(1)))}
                                </text>
                            </g>
                        ))}
                        {points.length > 1 && (
                            <polygon points={`${points[0].x},108 ${line} ${points[points.length - 1].x},108`} className="fill-rose" />
                        )}
                        <polyline points={line} fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-brand" />
                        {points.map((point) => (
                            <g key={point.id}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={point.id === selected.id ? 6 : 3.5}
                                    strokeWidth="2"
                                    className={point.id === selected.id ? 'fill-brand stroke-card' : 'fill-card stroke-brand'}
                                />
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="12"
                                    fill="transparent"
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${date(point.recorded_at)} : ${number(point.weight_kg)} kg`}
                                    aria-pressed={point.id === selected.id}
                                    onFocus={() => setSelectedId(point.id)}
                                    onMouseEnter={() => setSelectedId(point.id)}
                                    onClick={() => setSelectedId(point.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedId(point.id);
                                        }
                                    }}
                                    className="focus-visible:outline-brand cursor-pointer"
                                />
                            </g>
                        ))}
                        <text x="40" y="128" fontSize="10" className="fill-muted-foreground">
                            {date(first.recorded_at)}
                        </text>
                        {weights.length > 1 && (
                            <text x="292" y="128" textAnchor="end" fontSize="10" className="fill-muted-foreground">
                                {date(latest.recorded_at)}
                            </text>
                        )}
                    </svg>
                </>
            ) : (
                <p className="text-muted-foreground py-8 text-center text-sm leading-relaxed">
                    Aucune pesée pour le moment.
                    <br />
                    Ton évolution apparaîtra ici dès ta première pesée.
                </p>
            )}
        </section>
    );
}
