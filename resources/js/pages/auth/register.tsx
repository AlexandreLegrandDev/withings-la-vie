import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react';
import { useState, type FormEventHandler } from 'react';

import { AuthInput, PasswordInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { Mascot } from '@/components/mascot';
import { MeasurementSlider } from '@/components/measurement-slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

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

export default function Register() {
    const [step, setStep] = useState<Step>(1);

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
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
        if (step === 2 && !data.diet_status) return;

        if (step !== 3) {
            setStep(step === 1 ? 2 : 3);
            return;
        }

        post(route('register'), {
            onSuccess: () => reset('password'),
            onError: (validationErrors) => {
                if (validationErrors.name || validationErrors.email || validationErrors.password) {
                    setStep(1);
                } else if (validationErrors.diet_status) {
                    setStep(2);
                }
            },
        });
    };

    return (
        <AuthLayout>
            <Head title="Inscription" />

            <header className="flex items-start justify-between gap-4">
                <div className="pt-6">
                    <h1 className="text-[clamp(1.6rem,7vw,2rem)] leading-tight font-semibold tracking-tight">
                        Créer ton
                        <br />
                        <span className="font-display text-brand">compte</span>
                    </h1>
                    <p className="mt-3 max-w-[15rem] text-xs text-neutral-700">
                        Une minute, et Tofou t&apos;aide à composer des repas équilibrés.
                    </p>
                </div>
                <Mascot src="/image/tofou-register.png" color="bg-sun" className="w-[38%] shrink-0" />
            </header>

            <form className="mt-14 flex flex-col" onSubmit={submit}>
                <p className="mb-2 text-xs text-neutral-600" aria-live="polite">
                    Étape {step} sur 3
                </p>

                <fieldset disabled={processing} className="grid gap-5">
                    <legend className="mb-6 font-semibold">{stepTitles[step]}</legend>

                    {step === 1 && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="pl-4">Prénom</Label>
                                <AuthInput
                                    id="name"
                                    required
                                    autoComplete="given-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Prénom"
                                />
                                <InputError message={errors.name} className="pl-4" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className="pl-4">Email</Label>
                                <AuthInput
                                    id="email"
                                    type="email"
                                    inputMode="email"
                                    required
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="exemple@mail.com"
                                />
                                <InputError message={errors.email} className="pl-4" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password" className="pl-4">Mot de passe</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Mot de passe"
                                />
                                <InputError message={errors.password} className="pl-4" />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="grid justify-items-center gap-8">
                            {[
                                {
                                    value: 'vegetarian',
                                    title: 'Végétarien',
                                    description: 'Je suis déjà un régime végétarien.',
                                    background: 'bg-[#e0f3eb]',
                                },
                                {
                                    value: 'transition',
                                    title: 'En conversion',
                                    description: 'Je souhaite passer à une alimentation végétarienne.',
                                    background: 'bg-[#fff6cf]',
                                },
                            ].map((option) => (
                                <label key={option.value} className="relative cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="diet_status"
                                        value={option.value}
                                        checked={data.diet_status === option.value}
                                        onChange={(e) => setData('diet_status', e.target.checked ? option.value : '')}
                                        aria-describedby={errors.diet_status ? 'diet-status-error' : undefined}
                                        aria-invalid={Boolean(errors.diet_status)}
                                        className="peer sr-only"
                                    />
                                    <span
                                        className={`flex min-h-[185px] w-[185px] flex-col items-center justify-center gap-5 rounded-[30px] px-5 py-7 text-center text-neutral-600 ring-offset-4 transition-shadow peer-checked:ring-2 peer-checked:ring-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-8 peer-focus-visible:outline-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-60 ${option.background}`}
                                    >
                                        <span className="font-display text-xl">{option.title}</span>
                                        <span className="text-sm leading-tight">{option.description}</span>
                                    </span>
                                </label>
                            ))}
                            <InputError id="diet-status-error" message={errors.diet_status} />
                        </div>
                    )}

                    {step === 3 && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="sex" className="pl-4">Sexe</Label>
                                <select
                                    id="sex"
                                    required
                                    value={data.sex}
                                    onChange={(e) => setData('sex', e.target.value)}
                                    className="h-12 w-full rounded-full border bg-white px-4 text-sm"
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="female">Féminin</option>
                                    <option value="male">Masculin</option>
                                </select>
                                <InputError message={errors.sex} className="pl-4" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="date_of_birth" className="pl-4">Date de naissance</Label>
                                <AuthInput
                                    id="date_of_birth"
                                    type="date"
                                    required
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                />
                                <InputError message={errors.date_of_birth} className="pl-4" />
                            </div>

                            <MeasurementSlider
                                id="height_cm"
                                label="Taille"
                                min={1}
                                max={220}
                                step={1}
                                unit="cm"
                                value={data.height_cm}
                                onChange={(value) => setData('height_cm', value)}
                                error={errors.height_cm}
                            />

                            <MeasurementSlider
                                id="weight_kg"
                                label="Poids"
                                min={1}
                                max={250}
                                step={0.1}
                                unit="kg"
                                value={data.weight_kg}
                                onChange={(value) => setData('weight_kg', value)}
                                error={errors.weight_kg}
                            />
                        </>
                    )}
                </fieldset>

                <div className="mt-10 flex items-center gap-3">
                    {step > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            aria-label="Revenir à l’étape précédente"
                            onClick={() => setStep(step === 3 ? 2 : 1)}
                            className="size-14 shrink-0 rounded-full bg-night hover:bg-night/90"
                        >
                            <ArrowLeft className="size-5 text-white" aria-hidden="true" />
                        </Button>
                    )}

                    <Button
                        type="submit"
                        disabled={processing || (step === 2 && !data.diet_status)}
                        className="bg-night hover:bg-night/90 h-14 flex-1 rounded-full text-base text-white"
                    >
                        {step === 1 ? 'Commencer' : step === 2 ? 'Continuer' : 'Créer mon compte'}
                        {processing ? (
                            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            step < 3 && <ArrowRight className="size-4" aria-hidden="true" />
                        )}
                    </Button>
                </div>

                <p className="mt-4 text-center text-xs text-neutral-600">
                    Déjà un compte ?{' '}
                    <Link href={route('login')} className="text-brand font-medium">
                        Se connecter
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
