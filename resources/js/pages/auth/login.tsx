import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Sparkle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { AuthInput, PasswordInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { Mascot } from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        // Appli mobile : on reste connecté, comme dans une appli native.
        remember: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Connexion" />

            {/* Mascotte dans le cercle rose, avec deux étoiles jaunes */}
            <div className="relative mx-auto w-[62%]">
                <Sparkle className="absolute -top-2 left-0 size-5 fill-yellow-400 text-yellow-400" />
                <Sparkle className="absolute top-2 -right-2 size-6 fill-yellow-400 text-yellow-400" />
                <Mascot src="/image/tofou-login.png" color="bg-brand" />
            </div>

            <h1 className="mt-8 text-center text-[clamp(1.6rem,7.5vw,2rem)] font-semibold tracking-tight">
                Content de vous <span className="font-display text-brand">revoir</span>
            </h1>

            {status && <p className="mt-4 text-center text-sm font-medium text-green-600">{status}</p>}

            <form className="mt-10 flex flex-col" onSubmit={submit}>
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
                        onChange={(e) => setData('email', e.target.value)}
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
                        autoComplete="current-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Mot de passe"
                    />
                    <InputError message={errors.password} className="pl-4" />
                </div>

                {canResetPassword && (
                    <Link href={route('password.request')} className="decoration-brand mt-2 self-end pr-2 text-xs underline underline-offset-2">
                        Mot de passe oublié ?
                    </Link>
                )}

                <Button type="submit" disabled={processing} className="bg-night hover:bg-night/90 mt-8 h-14 w-full rounded-full text-base text-white">
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    Se connecter
                </Button>

                <p className="mt-4 text-center text-xs text-neutral-600">
                    Vous n'avez pas de compte ?{' '}
                    <Link href={route('register')} className="text-brand font-medium">
                        Créer un compte
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
