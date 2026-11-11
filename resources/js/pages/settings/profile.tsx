import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';

export default function Profile({ mustVerifyEmail, status, dietStatus }: { mustVerifyEmail: boolean; status?: string; dietStatus: string | null }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
        diet_status: dietStatus ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall title="Mes informations" description="Modifie ton nom et ton adresse email" />

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                            id="name"
                            className="h-12"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="Nom complet"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Adresse email</Label>
                        <Input
                            id="email"
                            type="email"
                            inputMode="email"
                            className="h-12"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="Adresse email"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="diet_status">Régime alimentaire</Label>
                        <select
                            id="diet_status"
                            value={data.diet_status}
                            onChange={(event) => setData('diet_status', event.target.value)}
                            className="h-12 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-black"
                        >
                            <option value="" disabled>
                                Choisir un régime
                            </option>
                            <option value="transition">En transition</option>
                            <option value="vegetarian">Végétarien</option>
                        </select>
                        <InputError message={errors.diet_status} />
                    </div>

                    {mustVerifyEmail && auth.user.email_verified_at === null && (
                        <div className="text-sm">
                            <p className="text-muted-foreground">
                                Ton adresse email n'est pas vérifiée.{' '}
                                <Link href={route('verification.send')} method="post" as="button" className="underline">
                                    Renvoyer l'email de vérification
                                </Link>
                            </p>
                            {status === 'verification-link-sent' && (
                                <p className="mt-2 font-medium text-green-600">Un nouveau lien de vérification a été envoyé.</p>
                            )}
                        </div>
                    )}

                    <Button disabled={processing} className="bg-brand hover:bg-brand/90 h-12 w-full rounded-full text-white">
                        Enregistrer
                    </Button>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-muted-foreground text-center text-sm">Enregistré</p>
                    </Transition>
                </form>
            </div>

            <DeleteUser />
        </SettingsLayout>
    );
}
