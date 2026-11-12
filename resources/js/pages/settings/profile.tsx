import { AuthInput } from '@/components/auth-input';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { MeasurementSlider } from '@/components/measurement-slider';
import { DietField, SexField } from '@/components/profile-fields';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import SettingsLayout, { SavedMessage, SettingsCard } from '@/layouts/settings/layout';
import { todayInParis } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEventHandler } from 'react';

interface Account {
    name: string;
    email: string;
    diet_status: string | null;
    sex: string | null;
    /** AAAA-MM-JJ */
    date_of_birth: string | null;
    height_cm: number | null;
}

/** Paramètres → Compte : identité, profil (sexe, date de naissance, taille) et régime. */
export default function ProfileSettings({ account }: { account: Account }) {
    const { data, setData, patch, errors, processing, recentlySuccessful, transform } = useForm({
        name: account.name,
        email: account.email,
        diet_status: account.diet_status ?? '',
        sex: account.sex ?? '',
        date_of_birth: account.date_of_birth ?? '',
        height_cm: String(account.height_cm ?? 170),
    });

    // Les champs jamais renseignés (anciens comptes) ne sont envoyés que si on les remplit
    transform((values) => Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '')));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), { preserveScroll: true });
    };

    return (
        <SettingsLayout title="Compte">
            <form onSubmit={submit} className="flex flex-col gap-4">
                <SettingsCard title="Ton compte" description="Ton prénom s’affiche sur l’accueil.">
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="pl-4">
                                Prénom
                            </Label>
                            <AuthInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="given-name"
                            />
                            <InputError message={errors.name} className="pl-4" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="pl-4">
                                Email
                            </Label>
                            <AuthInput
                                id="email"
                                type="email"
                                inputMode="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="email"
                            />
                            <InputError message={errors.email} className="pl-4" />
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard title="Ton profil" description="Ta date de naissance sert à calculer ton besoin en calcium.">
                    <div className="grid gap-5">
                        <SexField value={data.sex} onChange={(value) => setData('sex', value)} error={errors.sex} />
                        <div className="grid gap-2">
                            <Label htmlFor="date_of_birth" className="pl-4">
                                Date de naissance
                            </Label>
                            <AuthInput
                                id="date_of_birth"
                                type="date"
                                max={todayInParis()}
                                value={data.date_of_birth}
                                onChange={(e) => setData('date_of_birth', e.target.value)}
                            />
                            <InputError message={errors.date_of_birth} className="pl-4" />
                        </div>
                        <MeasurementSlider
                            id="height_cm"
                            label="Taille"
                            min={100}
                            max={220}
                            step={1}
                            unit="cm"
                            value={data.height_cm}
                            onChange={(value) => setData('height_cm', value)}
                            error={errors.height_cm}
                        />
                        <p className="text-muted-foreground pl-4 text-sm">
                            Ton poids se met à jour depuis ton profil, avec l’historique de tes pesées.
                        </p>
                    </div>
                </SettingsCard>

                <SettingsCard title="Ton régime">
                    <DietField layout="row" value={data.diet_status} onChange={(value) => setData('diet_status', value)} error={errors.diet_status} />
                </SettingsCard>

                <Button type="submit" disabled={processing} className="bg-ink text-ink-foreground hover:bg-ink/90 h-14 w-full rounded-full text-base">
                    {processing && <LoaderCircle className="animate-spin" />}
                    Enregistrer
                </Button>
                <SavedMessage show={recentlySuccessful} />
            </form>

            <DeleteUser />
        </SettingsLayout>
    );
}
