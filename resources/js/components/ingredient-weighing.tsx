import { IngredientNutrients } from '@/components/ingredient-nutrients';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useKitchenScale } from '@/contexts/kitchen-scale-context';
import type { Food } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Keyboard, LoaderCircle, X } from 'lucide-react';
import { useRef } from 'react';

/** Démo : la balance n'est pas encore reliée à l'API Withings, elle affiche toujours ce poids. */
const DEMO_WEIGHT_G = 98;
const DEMO_PORTION_G = 100;

/** Écran plein de pesée avec la balance de cuisine Withings. */
export function IngredientWeighing({
    mealId,
    foodName,
    food,
    open,
    onClose,
    onManual,
}: {
    mealId: number;
    foodName: string;
    food?: Food;
    open: boolean;
    onClose: () => void;
    onManual: (weight: string) => void;
}) {
    const { connected } = useKitchenScale();
    const screenRef = useRef<HTMLDivElement>(null);
    const { post, processing, errors } = useForm({ food_key: food?.key ?? null, food_name: foodName, weight_g: DEMO_WEIGHT_G });

    return (
        <Dialog
            open={open && connected}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && !processing) onClose();
            }}
        >
            <DialogContent
                ref={screenRef}
                hideClose
                className="bg-background inset-0 top-0 left-0 z-[60] block h-dvh w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 p-0"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    screenRef.current?.focus({ preventScroll: true });
                }}
            >
                <form
                    className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (processing || !connected) return;
                        post(route('meals.items.store', mealId), { onSuccess: () => router.flushAll() });
                    }}
                >
                    {/* En-tête : état de la balance à gauche, fermeture à droite, alignés sur la même ligne */}
                    <div className="flex items-center justify-between gap-3">
                        <span className="bg-mint text-mint-ink flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                            <span className="bg-leaf size-2 rounded-full" aria-hidden="true" />
                            Balance connectée
                        </span>
                        <DialogClose
                            disabled={processing}
                            className="bg-muted hover:bg-muted/70 focus-visible:outline-brand flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 disabled:opacity-50"
                        >
                            <X className="size-5" />
                            <span className="sr-only">Fermer la pesée</span>
                        </DialogClose>
                    </div>

                    <img src="/image/Balance.svg" alt="" className="mx-auto mt-6 w-[min(72vw,300px)]" />

                    <DialogTitle className="mt-5 text-center text-lg font-semibold">{foodName}</DialogTitle>
                    <div className="mt-2 text-center" aria-live="polite">
                        <p className="text-7xl leading-tight font-semibold tracking-tight tabular-nums">
                            {DEMO_WEIGHT_G}
                            <span className="text-muted-foreground ml-2 text-3xl font-normal">g</span>
                        </p>
                        <p className="text-mint-ink mt-1 text-sm font-medium">Poids stable</p>
                    </div>
                    <DialogDescription className="sr-only">
                        Pesée de {DEMO_WEIGHT_G} grammes. Tu peux ajouter cet aliment au repas ou saisir son poids à la main.
                    </DialogDescription>

                    <div className="mt-6">
                        <div className="mb-2 flex justify-between gap-2 text-sm">
                            <span className="font-medium">Portion conseillée</span>
                            <span className="text-subtle tabular-nums">
                                {DEMO_WEIGHT_G} / {DEMO_PORTION_G} g
                            </span>
                        </div>
                        <div
                            role="progressbar"
                            aria-label="Poids par rapport à la portion conseillée"
                            aria-valuemin={0}
                            aria-valuemax={DEMO_PORTION_G}
                            aria-valuenow={DEMO_WEIGHT_G}
                            className="bg-muted h-2 overflow-hidden rounded-full"
                        >
                            <div
                                className="bg-leaf h-full rounded-full"
                                style={{ width: `${Math.min(100, (DEMO_WEIGHT_G / DEMO_PORTION_G) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-5">
                        <IngredientNutrients per100g={food?.per100g} estimated={food?.estimated} weightG={DEMO_WEIGHT_G} />
                    </div>
                    <InputError message={errors.food_key || errors.food_name || errors.weight_g} className="mt-3" />

                    <div className="mt-auto grid gap-3 pt-8">
                        <Button
                            type="submit"
                            disabled={processing || !connected}
                            className="bg-brand hover:bg-brand/90 h-14 w-full rounded-full text-base text-white"
                        >
                            {processing && <LoaderCircle className="animate-spin" aria-hidden="true" />}
                            Ajouter au repas
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={processing}
                            onClick={() => onManual(String(DEMO_WEIGHT_G))}
                            className="text-subtle h-12 w-full rounded-full text-sm"
                        >
                            <Keyboard aria-hidden="true" />
                            Saisir le poids à la main
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
