import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useKitchenScale } from '@/contexts/kitchen-scale-context';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Bluetooth, BluetoothOff, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface KitchenScaleProps {
    /** Page affichée après la connexion : profil, repas, ou la page en cours (« back », ex. pendant l'ajout d'un aliment). */
    returnTo: 'profile' | 'meals' | 'back';
    /** Bouton personnalisé qui ouvre la fenêtre (par défaut : la carte « Balance de cuisine Withings »). */
    trigger?: ReactNode;
}

/** Carte de la balance de cuisine Withings, et fenêtre pour la connecter ou la déconnecter (appairage simulé). */
export function KitchenScale({ returnTo, trigger }: KitchenScaleProps) {
    const { connected, setConnected } = useKitchenScale();
    const [open, setOpen] = useState(false);
    const connection = useForm({ return_to: returnTo });

    const toggleConnection = () => {
        if (connection.processing) return;
        connection.post(route(connected ? 'profile.kitchen-scale.disconnect' : 'profile.kitchen-scale.connect'), {
            preserveScroll: true,
            // Reste sur la même page sans perdre ce qui était en cours (aliment choisi, poids saisi…)
            preserveState: returnTo === 'back',
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
                {trigger ?? (
                    <button
                        type="button"
                        className="border-border hover:bg-muted focus-visible:outline-brand flex w-full items-center gap-3 rounded-3xl border px-3 py-3 text-left focus-visible:outline-2"
                    >
                        <img src="/image/Balance_sansbol.svg" alt="" className="size-12 shrink-0" />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">Balance de cuisine Withings</span>
                            <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                                <span aria-hidden className={cn('size-2 shrink-0 rounded-full', connected ? 'bg-leaf' : 'bg-faint')} />
                                {connected ? 'Connectée à ton compte' : 'Aucune balance connectée'}
                            </span>
                        </span>
                        <span className="text-brand flex shrink-0 items-center text-xs font-semibold">
                            {connected ? 'Gérer' : 'Connecter'}
                            <ChevronRight className="size-4" />
                        </span>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent>
                {/* Sans fond coloré : l'image de la balance prend toute la largeur disponible */}
                <img src="/image/Balance_sansbol.svg" alt="" className="mx-auto mt-2 w-[min(60vw,220px)]" />
                <DialogTitle className="text-center text-xl leading-snug">
                    {connected ? 'Ta balance est connectée' : 'Connecte ta balance de cuisine'}
                </DialogTitle>
                <DialogDescription className="text-subtle text-center text-sm">
                    {connected
                        ? 'Ta balance de cuisine est associée à ton compte. Tu peux la déconnecter à tout moment.'
                        : 'Allume ta balance et garde-la près de ton téléphone pour l’appairer en Bluetooth.'}
                </DialogDescription>
                <Button
                    type="button"
                    disabled={connection.processing}
                    onClick={toggleConnection}
                    className={cn(
                        'h-12 rounded-full text-base',
                        connected ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-brand hover:bg-brand/90 text-white',
                    )}
                >
                    {connected ? <BluetoothOff aria-hidden="true" /> : <Bluetooth aria-hidden="true" />}
                    {connection.processing
                        ? connected
                            ? 'Déconnexion…'
                            : 'Connexion…'
                        : connected
                          ? 'Déconnecter la balance'
                          : 'Appairer en Bluetooth'}
                </Button>
                <p className="text-muted-foreground text-center text-xs">Appairage simulé : l’association est enregistrée sur ton compte.</p>
            </DialogContent>
        </Dialog>
    );
}
