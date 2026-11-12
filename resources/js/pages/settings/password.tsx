import { PasswordInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import SettingsLayout, { SavedMessage, SettingsCard } from '@/layouts/settings/layout';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useRef, type FormEventHandler } from 'react';

/** Paramètres → Mot de passe. */
export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const fields = [
        { id: 'current_password', label: 'Mot de passe actuel', ref: currentPasswordInput, autoComplete: 'current-password' },
        { id: 'password', label: 'Nouveau mot de passe', ref: passwordInput, autoComplete: 'new-password' },
        { id: 'password_confirmation', label: 'Confirme le nouveau mot de passe', ref: undefined, autoComplete: 'new-password' },
    ] as const;

    return (
        <SettingsLayout title="Mot de passe">
            <SettingsCard title="Change ton mot de passe" description="8 caractères minimum. Plus il est long, plus il est difficile à deviner.">
                <form onSubmit={updatePassword} className="grid gap-5">
                    {fields.map((field) => (
                        <div key={field.id} className="grid gap-2">
                            <Label htmlFor={field.id} className="pl-4">
                                {field.label}
                            </Label>
                            <PasswordInput
                                id={field.id}
                                ref={field.ref}
                                value={data[field.id]}
                                onChange={(e) => setData(field.id, e.target.value)}
                                autoComplete={field.autoComplete}
                            />
                            <InputError message={errors[field.id]} className="pl-4" />
                        </div>
                    ))}

                    <Button disabled={processing} className="bg-ink text-ink-foreground hover:bg-ink/90 h-14 w-full rounded-full text-base">
                        {processing && <LoaderCircle className="animate-spin" />}
                        Enregistrer le mot de passe
                    </Button>
                    <SavedMessage show={recentlySuccessful} />
                </form>
            </SettingsCard>
        </SettingsLayout>
    );
}
