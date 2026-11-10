import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { AuthInput, PasswordInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { Mascot } from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Inscription" />

            {/* Titre à gauche, mascotte dans le cercle jaune à droite */}
            <header className="flex items-start justify-between gap-4">
                <div className="pt-6">
                    <h1 className="text-[clamp(1.6rem,7vw,2rem)] leading-tight font-semibold tracking-tight">
                        Créer votre
                        <br />
                        <span className="font-display text-brand">compte</span>
                    </h1>
                    <p className="mt-3 max-w-[15rem] text-xs text-neutral-700">Une minute, et Tofou t'aide à composer des repas équilibrés.</p>
                </div>
                <Mascot src="/image/tofou-register.png" color="bg-sun" className="w-[38%] shrink-0" />
            </header>

            <form className="mt-14 flex flex-col" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="pl-4">
                        Prénom
                    </Label>
                    <AuthInput
                        id="name"
                        required
                        autoComplete="given-name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        disabled={processing}
                        placeholder="Camille"
                    />
                    <InputError message={errors.name} className="pl-4" />
                </div>

                <div className="mt-5 grid gap-2">
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
                        onChange={(e) => setData('email', e.target.value)}
                        disabled={processing}
                        placeholder="exemple@gmail.com"
                    />
                    <InputError message={errors.email} className="pl-4" />
                </div>

                <div className="mt-5 grid gap-2">
                    <Label htmlFor="password" className="pl-4">
                        Mot de passe
                    </Label>
                    <PasswordInput
                        id="password"
                        required
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        disabled={processing}
                        placeholder="Mot de passe"
                    />
                    <InputError message={errors.password} className="pl-4" />
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="bg-night hover:bg-night/90 mt-10 h-14 w-full rounded-full text-base text-white"
                >
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Commencer
                </Button>

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
