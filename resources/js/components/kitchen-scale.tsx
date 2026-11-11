import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useKitchenScale } from '@/contexts/kitchen-scale-context';
import type { SharedData } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Bluetooth, BluetoothOff } from 'lucide-react';
import { useState } from 'react';

export function KitchenScale({ returnTo }: { returnTo: 'profile' | 'meals' }) {
    const { connected, setConnected } = useKitchenScale();
    const [open, setOpen] = useState(false);
    const connection = useForm({ return_to: returnTo });

    const toggleConnection = () => {
        if (connection.processing) return;
        connection.post(route(connected ? 'profile.kitchen-scale.disconnect' : 'profile.kitchen-scale.connect'), {
            preserveScroll: true,
            onSuccess: (page) => {
                // La réponse serveur confirme l'état ; toutes les instances se mettent à jour ensemble.
                setConnected((page.props.auth as SharedData['auth']).user.kitchen_scale_connected);
                router.flushAll();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!connection.processing) setOpen(nextOpen);
            }}
        >
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="focus-visible:outline-brand flex w-full items-center gap-3 rounded-[20px] border border-neutral-200 px-3 py-3 text-left hover:bg-neutral-50 focus-visible:outline-2"
                >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl">
                        <img src="/image/Balance_sansbol.svg" alt="" className="size-full" />
                    </span>
                    <span className="flex-1">
                        <span className="block text-xs font-semibold">Balance de cuisine Withings</span>
                        <span className="mt-0.5 block text-[10px] text-neutral-500">
                            {connected ? 'Balance connectée à ton compte' : 'Aucune balance connectée'}
                        </span>
                        <span className="text-brand mt-1 block text-[10px]">{connected ? 'Gérer la connexion' : 'Connecter ma balance'}</span>
                    </span>
                    {connected ? (
                        <span className="size-2 shrink-0 rounded-full bg-[#5dc28c]" aria-hidden="true" />
                    ) : (
                        <Bluetooth className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
                    )}
                </button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-3xl border-neutral-200 bg-white text-black">
                <div className="mx-auto flex size-28 items-center justify-center rounded-3xl bg-[#d9ecfa] p-5">
                    <img src="/image/Balance_sansbol.svg" alt="" className="size-full" />
                </div>
                <DialogTitle className="text-center">{connected ? 'Ta balance est connectée' : 'Connecter ta balance de cuisine'}</DialogTitle>
                <DialogDescription className="text-center text-neutral-600">
                    {connected
                        ? 'Ta balance de cuisine est associée à ton compte. Tu peux la déconnecter à tout moment.'
                        : 'Allume ta balance et garde-la près de ton téléphone pour l’appairer en Bluetooth.'}
                </DialogDescription>
                <Button
                    type="button"
                    disabled={connection.processing}
                    onClick={toggleConnection}
                    className="bg-brand hover:bg-brand/90 h-12 rounded-full text-white"
                >
                    {connected ? <BluetoothOff className="size-4" aria-hidden="true" /> : <Bluetooth className="size-4" aria-hidden="true" />}
                    {connection.processing
                        ? connected
                            ? 'Déconnexion…'
                            : 'Connexion…'
                        : connected
                          ? 'Déconnecter la balance'
                          : 'Appairer en Bluetooth'}
                </Button>
                <p className="text-center text-xs text-neutral-500">Appairage simulé : l’association est enregistrée sur ton compte.</p>
            </DialogContent>
        </Dialog>
    );
}
