import { PasswordInput } from '@/components/auth-input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { useRef, type FormEventHandler } from 'react';

/** Bloc « Supprimer mon compte » des paramètres, avec confirmation par mot de passe. */
export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        clearErrors();
        reset();
    };

    return (
        <section className="bg-rose-soft mt-4 rounded-3xl p-5">
            <h2 className="text-lg font-bold">Supprimer ton compte</h2>
            <p className="text-rose-ink mt-1 text-sm">
                Toutes tes données (repas, pesées, objectifs) seront supprimées. Cette action est définitive.
            </p>

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="destructive" className="mt-4 h-12 w-full rounded-full text-base">
                        Supprimer mon compte
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle className="pr-8 leading-snug">Supprimer définitivement ton compte ?</DialogTitle>
                    <DialogDescription className="text-subtle">
                        Toutes tes données seront supprimées. Entre ton mot de passe pour confirmer.
                    </DialogDescription>
                    <form className="grid gap-4" onSubmit={deleteUser}>
                        <div className="grid gap-2">
                            <Label htmlFor="delete-password" className="sr-only">
                                Mot de passe
                            </Label>
                            <PasswordInput
                                id="delete-password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Ton mot de passe"
                                autoComplete="current-password"
                            />
                            <InputError message={errors.password} className="pl-4" />
                        </div>

                        <div className="flex gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={closeModal} className="h-12 flex-1 rounded-full">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit" variant="destructive" disabled={processing} className="h-12 flex-1 rounded-full">
                                Supprimer
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
