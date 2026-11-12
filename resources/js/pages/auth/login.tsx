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

export default function Login({ status }: { status?: string }) {
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

            {/* Mascotte Bacon sur le blob rose, avec deux étoiles jaunes */}
            <div className="relative mx-auto w-[62%]">
                <Sparkle className="fill-butter text-butter absolute -top-2 left-0 size-5" />
                <Sparkle className="fill-butter text-butter absolute top-2 -right-2 size-6" />
                <Mascot src="/image/Bacon.svg" alt="Bacon, la mascotte de Veggings" color="bg-brand" />
            </div>

            <h1 className="mt-8 text-center text-[clamp(1.6rem,7.5vw,2rem)] font-semibold tracking-tight">
                Content de te <span className="font-display text-brand font-normal">revoir</span>
            </h1>

            {status && <p className="text-mint-ink mt-4 text-center text-sm font-medium">{status}</p>}

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
                        placeholder="exemple@mail.com"
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
                        placeholder="Ton mot de passe"
                    />
                    <InputError message={errors.password} className="pl-4" />
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="bg-ink text-ink-foreground hover:bg-ink/90 mt-8 h-14 w-full rounded-full text-base"
                >
                    {processing && <LoaderCircle className="animate-spin" />}
                    Se connecter
                </Button>

                <p className="text-subtle mt-4 text-center text-sm">
                    Pas encore de compte ?{' '}
                    <Link href={route('register')} className="text-brand font-semibold">
                        Créer un compte
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
