import InputError from '@/components/input-error';
import { MeasurementSlider } from '@/components/measurement-slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MobileLayout from '@/layouts/mobile-layout';
import { Link, useForm } from '@inertiajs/react';
import { Bluetooth, Pencil, Plus, Settings } from 'lucide-react';
import { useState } from 'react';

type WeightEntry = { id: number; weight_kg: number; recorded_at: string };
type ProfileData = {
    name: string;
    sex: string | null;
    diet_status: string | null;
    transition_days: number | null;
    protein_target_g: string | null;
    iron_target_mg: string | null;
    b12_target_ug: string | null;
    calcium_target_mg: string | null;
    zinc_target_mg: string | null;
};

const number = (value: number | string) => Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 3 });
const date = (value: string) => new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

export default function Profile({ profile, weights }: { profile: ProfileData; weights: WeightEntry[] }) {
    const latest = weights.at(-1);
    const diet = profile.diet_status === 'vegetarian' ? 'Végétarien' : profile.diet_status === 'transition' ? 'En conversion' : 'Non renseigné';
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
                    <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{subtitle}</p>
                </div>
                <Link
                    href={route('profile.edit')}
                    aria-label="Modifier mon profil"
                    className="focus-visible:outline-brand flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 focus-visible:outline-2"
                >
                    <Settings className="size-6" strokeWidth={1.5} />
                </Link>
            </header>

            <dl className="mt-6 grid grid-cols-3 gap-2">
                {[
                    { label: 'Sexe', value: profile.sex === 'female' ? 'Femme' : profile.sex === 'male' ? 'Homme' : 'Non renseigné' },
                    { label: 'Poids', value: latest ? `${number(latest.weight_kg)} kg` : 'Non renseigné' },
                    { label: 'Régime', value: diet },
                ].map(({ label, value }) => (
                    <div key={label} className="relative rounded-[20px] bg-[#f4f4f6] px-3 py-3">
                        <dt className="text-[10px] text-neutral-500">{label}</dt>
                        <dd className="mt-0.5 text-xs font-semibold">
                            {value}
                            {label === 'Poids' && (
                                <>
                                    <span className="mt-1 flex items-center gap-1 text-[10px] font-normal text-brand">
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
                <h2 id="targets-title" className="text-sm font-semibold">
                    Tes objectifs par jour
                </h2>
                <dl className="mt-1 divide-y divide-neutral-100">
                    {targets.map(({ label, value, unit }) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                            <dt>{label}</dt>
                            <dd className="tabular-nums">{value === null ? 'À renseigner' : `${number(value)} ${unit}`}</dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                    Objectifs estimés selon ton profil, à partir des repères ANSES et EFSA.
                </p>
            </section>

            <section className="mt-5" aria-labelledby="devices-title">
                <h2 id="devices-title" className="mb-2 text-sm font-semibold">
                    Appareils
                </h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="focus-visible:outline-brand flex w-full items-center gap-3 rounded-[20px] border border-neutral-200 px-3 py-3 text-left hover:bg-neutral-50 focus-visible:outline-2"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl">
                                <img src="/image/Balance_sansbol.svg" alt="" className="size-full" aria-hidden="true" />
                            </span>
                            <span className="flex-1">
                                <span className="block text-xs font-semibold">Balance de cuisine Withings</span>
                                <span className="mt-0.5 block text-[10px] text-neutral-500">Aucune balance connectée</span>
                            </span>
                            <Bluetooth className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border-neutral-200 bg-white text-black">
                        <div className="mx-auto flex size-28 items-center justify-center rounded-3xl bg-[#d9ecfa] p-5">
                            <img src="/image/Balance_sansbol.svg" alt="" className="size-full" />
                        </div>
                        <DialogTitle className="text-center">Connecter ta balance de cuisine</DialogTitle>
                        <DialogDescription className="text-center text-neutral-600">
                            Allume ta balance et garde-la près de ton téléphone pour l’appairer en Bluetooth.
                        </DialogDescription>
                        <Button type="button" className="bg-brand hover:bg-brand/90 h-12 rounded-full text-white">
                            <Bluetooth className="size-4" aria-hidden="true" />
                            Appairer en Bluetooth
                        </Button>
                        <p className="text-center text-xs text-neutral-500">Démonstration : aucune connexion ne sera lancée.</p>
                    </DialogContent>
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="focus-visible:outline-brand mt-2 flex w-full items-center gap-3 rounded-[20px] border border-dashed border-neutral-400 px-3 py-3 text-left hover:bg-neutral-50 focus-visible:outline-2"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4f4f6]">
                                <Plus className="size-5" aria-hidden="true" />
                            </span>
                            <span>
                                <span className="block text-xs font-semibold">Ajouter une balance corporelle</span>
                                <span className="block text-[10px] text-neutral-500">Pour suivre aussi ta masse musculaire</span>
                            </span>
                        </button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border-neutral-200 bg-white text-black">
                        <DialogTitle>Connecter une balance</DialogTitle>
                        <DialogDescription className="text-black">
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
                className="hover:text-brand mx-auto mt-6 block rounded-full px-5 py-2 text-xs text-neutral-500 underline underline-offset-4"
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
            <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border-neutral-200 bg-white text-black">
                <DialogTitle>Mettre à jour ton poids</DialogTitle>
                <DialogDescription className="text-black">
                    Cette pesée sera ajoutée à ton historique à la date et à l’heure de l’enregistrement.
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
                            min={1}
                            max={250}
                            step={1}
                            unit="kg"
                            onChange={(value) => setData('weight_kg', value)}
                        />
                        <label htmlFor="profile-weight" className="text-xs text-black">
                            Poids exact (kg)
                        </label>
                        <input
                            id="profile-weight"
                            name="weight_kg"
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            max="500"
                            step="0.01"
                            required
                            value={data.weight_kg}
                            onChange={(event) => setData('weight_kg', event.target.value)}
                            aria-invalid={Boolean(errors.weight_kg)}
                            aria-describedby={errors.weight_kg ? 'profile-weight-error' : undefined}
                            className="focus-visible:outline-brand h-12 w-full rounded-full border border-neutral-200 bg-white px-4 text-sm text-black [color-scheme:light]"
                        />
                        <InputError id="profile-weight-error" message={errors.weight_kg} />
                    </fieldset>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={() => setOpen(false)}
                            className="flex-1 rounded-full border-neutral-200 bg-white text-black hover:bg-neutral-100 hover:text-black"
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand/90 flex-1 rounded-full text-white">
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
        <section className="mt-5 overflow-hidden rounded-[24px] border border-neutral-200 p-4" aria-labelledby="weight-title">
            <div className="flex items-center justify-between gap-2">
                <h2 id="weight-title" className="text-sm font-semibold">
                    Ton poids
                </h2>
                <span className="text-[9px] text-neutral-500">Pesées enregistrées</span>
            </div>
            {latest && selected ? (
                <>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-3xl tracking-tight tabular-nums">
                            {number(selected.weight_kg)}
                            <span className="ml-1 text-xs text-neutral-500">kg</span>
                        </p>
                        {weights.length > 1 && (
                            <p className="rounded-full bg-[#e0f3eb] px-3 py-1.5 text-[10px] text-[#287354]">
                                {difference > 0 ? '+' : ''}
                                {number(Number(difference.toFixed(2)))} kg · {days >= 7 ? `${Math.floor(days / 7)} sem.` : `${days} j`}
                            </p>
                        )}
                    </div>
                    <p className="mt-1 text-[10px] text-neutral-500">{date(selected.recorded_at)}</p>
                    <svg
                        viewBox="0 0 320 132"
                        className="mt-2 w-full overflow-visible"
                        role="group"
                        aria-label="Évolution du poids. Sélectionne une pesée pour afficher sa valeur."
                    >
                        {[0, 0.5, 1].map((ratio) => (
                            <g key={ratio}>
                                <line x1="40" x2="292" y1={28 + ratio * 72} y2={28 + ratio * 72} stroke="#f0f0f2" />
                                <text x="30" y={31 + ratio * 72} textAnchor="end" fontSize="9" fill="#777780">
                                    {number(Number((max - ratio * (max - min)).toFixed(1)))}
                                </text>
                            </g>
                        ))}
                        {points.length > 1 && <polygon points={`${points[0].x},108 ${line} ${points[points.length - 1].x},108`} fill="#ffd9e8" />}
                        <polyline points={line} fill="none" stroke="#e33d81" strokeWidth="2.5" strokeLinejoin="round" />
                        {points.map((point) => (
                            <g key={point.id}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={point.id === selected.id ? 6 : 3.5}
                                    fill={point.id === selected.id ? '#e33d81' : 'white'}
                                    stroke={point.id === selected.id ? 'white' : '#e33d81'}
                                    strokeWidth="2"
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
                        <text x="40" y="128" fontSize="9" fill="#777780">
                            {date(first.recorded_at)}
                        </text>
                        {weights.length > 1 && (
                            <text x="292" y="128" textAnchor="end" fontSize="9" fill="#777780">
                                {date(latest.recorded_at)}
                            </text>
                        )}
                    </svg>
                </>
            ) : (
                <p className="py-8 text-center text-xs leading-relaxed text-neutral-500">
                    Aucune pesée pour le moment.
                    <br />
                    Ton évolution apparaîtra ici dès ta première pesée.
                </p>
            )}
        </section>
    );
}
