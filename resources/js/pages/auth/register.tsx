import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react';
import { useState, type FormEventHandler } from 'react';

import { AuthInput, PasswordInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { Mascot } from '@/components/mascot';
import { MeasurementSlider } from '@/components/measurement-slider';
import { DietField, SexField } from '@/components/profile-fields';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { todayInParis } from '@/lib/format';

import { cn } from '@/lib/utils';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    diet_status: string;
    sex: string;
    date_of_birth: string;
    height_cm: string;
    weight_kg: string;
};

type Step = 1 | 2 | 3;

const stepTitles: Record<Step, string> = {
    1: 'Tes identifiants',
    2: 'Ton régime alimentaire',
    3: 'Ton profil',
};

/** Longueur minimale du mot de passe (Password::defaults() côté Laravel). */
const PASSWORD_MIN_LENGTH = 8;

export default function Register() {
    const [step, setStep] = useState<Step>(1);

    const { data, setData, post, processing, errors, clearErrors } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        diet_status: '',
        sex: '',
        date_of_birth: '',
        height_cm: '170',
        weight_kg: '70',
    });

    const submit: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (processing) return;

        // Étape 1 : le serveur vérifie tout de suite prénom, email (déjà utilisé ?) et mot de passe,
        // pour afficher l'erreur ici plutôt qu'à la fin de l'inscription.
        if (step === 1) {
            post(route('register.credentials'), {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setStep(2),
            });
            return;
        }

        if (step === 2) {
            if (data.diet_status) setStep(3);
            return;
        }

        post(route('register'), {
            onError: (validationErrors) => {
                if (validationErrors.name || validationErrors.email || validationErrors.password) {
                    setStep(1);
                } else if (validationErrors.diet_status) {
                    setStep(2);
                }
            },
        });
    };

    /** Modifier un champ efface son erreur : l'utilisateur voit qu'il l'a corrigée. */
    const update = (field: keyof RegisterForm, value: string) => {
        setData(field, value);
        if (errors[field]) clearErrors(field);
    };

    const passwordTooShort = data.password.length > 0 && data.password.length < PASSWORD_MIN_LENGTH;

    return (
        <AuthLayout>
            <Head title="Inscription" />

            <header className="flex items-start justify-between gap-4">
                <div className="pt-6">
                    <h1 className="text-[clamp(1.6rem,7vw,2rem)] leading-tight font-semibold tracking-tight">
                        Crée ton
                        <br />
                        <span className="font-display text-brand font-normal">compte</span>
                    </h1>
                    <p className="text-subtle mt-3 max-w-[15rem] text-sm">Une minute, et on t&apos;aide à composer des repas équilibrés.</p>
                </div>
                {/* Mascotte Bacon sur le blob jaune */}
                <Mascot src="/image/mascotte-bacon.png" alt="Bacon, la mascotte de Veggings" color="bg-sun" className="w-[38%] shrink-0" />
            </header>

            <form className="mt-14 flex flex-col" onSubmit={submit} noValidate={step === 1}>
                <p className="text-subtle mb-2 text-sm" aria-live="polite">
                    Étape {step} sur 3
                </p>

                <fieldset disabled={processing} className="grid gap-5">
                    <legend className="mb-6 text-lg font-semibold">{stepTitles[step]}</legend>

                    {step === 1 && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="pl-4">
                                    Prénom
                                </Label>
                                <AuthInput
                                    id="name"
                                    required
                                    autoComplete="given-name"
                                    value={data.name}
                                    onChange={(e) => update('name', e.target.value)}
                                    placeholder="Ton prénom"
                                    aria-invalid={Boolean(errors.name)}
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
                                    required
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => update('email', e.target.value)}
                                    placeholder="exemple@mail.com"
                                    aria-invalid={Boolean(errors.email)}
                                />
                                <InputError message={errors.email} className="pl-4" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password" className="pl-4">
                                    Mot de passe
                                </Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => update('password', e.target.value)}
                                    placeholder="Ton mot de passe"
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby="password-hint"
                                />
                                {errors.password ? (
                                    <InputError message={errors.password} className="pl-4" />
                                ) : (
                                    // Indication en direct, avant même de cliquer sur « Commencer »
                                    <p
                                        id="password-hint"
                                        className={cn('pl-4 text-sm', passwordTooShort ? 'text-destructive' : 'text-muted-foreground')}
                                    >
                                        {PASSWORD_MIN_LENGTH} caractères minimum
                                        {passwordTooShort && ` (encore ${PASSWORD_MIN_LENGTH - data.password.length})`}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <DietField value={data.diet_status} onChange={(value) => update('diet_status', value)} error={errors.diet_status} />
                    )}

                    {step === 3 && (
                        <>
                            <SexField value={data.sex} onChange={(value) => update('sex', value)} error={errors.sex} />

                            <div className="grid gap-2">
                                <Label htmlFor="date_of_birth" className="pl-4">
                                    Date de naissance
                                </Label>
                                <AuthInput
                                    id="date_of_birth"
                                    type="date"
                                    required
                                    max={todayInParis()}
                                    value={data.date_of_birth}
                                    onChange={(e) => update('date_of_birth', e.target.value)}
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
                                onChange={(value) => update('height_cm', value)}
                                error={errors.height_cm}
                            />

                            <MeasurementSlider
                                id="weight_kg"
                                label="Poids"
                                min={30}
                                max={200}
                                step={1}
                                unit="kg"
                                value={data.weight_kg}
                                onChange={(value) => update('weight_kg', value)}
                                error={errors.weight_kg}
                            />
                        </>
                    )}
                </fieldset>

                <div className="mt-10 flex items-center gap-3">
                    {step > 1 && (
                        <Button
                            type="button"
                            disabled={processing}
                            aria-label="Revenir à l’étape précédente"
                            onClick={() => setStep(step === 3 ? 2 : 1)}
                            className="bg-muted text-foreground hover:bg-muted/80 size-14 shrink-0 rounded-full"
                        >
                            <ArrowLeft className="size-5" aria-hidden="true" />
                        </Button>
                    )}

                    <Button
                        type="submit"
                        disabled={processing || (step === 2 && !data.diet_status)}
                        className="bg-ink text-ink-foreground hover:bg-ink/90 h-14 flex-1 rounded-full text-base"
                    >
                        {step === 1 ? 'Commencer' : step === 2 ? 'Continuer' : 'Créer mon compte'}
                        {processing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : step < 3 && <ArrowRight aria-hidden="true" />}
                    </Button>
                </div>

                <p className="text-subtle mt-4 text-center text-sm">
                    Déjà un compte ?{' '}
                    <Link href={route('login')} className="text-brand font-semibold">
                        Se connecter
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
