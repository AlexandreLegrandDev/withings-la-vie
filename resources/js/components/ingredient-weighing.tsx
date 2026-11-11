import { IngredientNutrients } from '@/components/ingredient-nutrients';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useKitchenScale } from '@/contexts/kitchen-scale-context';
import type { Food } from '@/types';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useRef } from 'react';

const DEMO_WEIGHT_G = 98;
const DEMO_PORTION_G = 100;

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
                className="text-night inset-0 top-0 left-0 z-[60] block h-dvh w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-white p-0 sm:rounded-none [&>button]:top-5 [&>button]:right-5 [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-[#f4f4f6]"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    screenRef.current?.focus({ preventScroll: true });
                }}
            >
                <form
                    className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (processing || !connected) return;
                        post(route('meals.items.store', mealId));
                    }}
                >
                    <div className="mr-12 flex items-center gap-2 self-start rounded-full bg-[#d0f0e0] px-4 py-2 text-xs font-medium text-[#287354]">
                        <span className="size-2 rounded-full bg-[#5dc28c]" aria-hidden="true" />
                        Balance connectée
                    </div>
                    <img
                        src="/image/Balance.svg"
                        alt="Balance de cuisine affichant le poids simulé de 98 grammes"
                        className="mx-auto mt-7 w-[min(70vw,280px)]"
                    />
                    <DialogTitle className="mt-5 text-center text-base font-semibold">{foodName}</DialogTitle>
                    <div className="mt-4 text-center">
                        <p className="text-7xl leading-tight tracking-tight tabular-nums">
                            {DEMO_WEIGHT_G}
                            <span className="ml-3 text-3xl text-neutral-500">g</span>
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#287354]">Poids stable</p>
                    </div>
                    <DialogDescription className="sr-only">
                        Pesée simulée de 98 grammes. Tu peux ajouter cet aliment au repas ou saisir son poids à la main.
                    </DialogDescription>
                    <div className="mt-5">
                        <div className="mb-2 flex justify-between gap-2 text-sm">
                            <span className="font-medium">Portion conseillée</span>
                            <span className="text-neutral-600">
                                {DEMO_WEIGHT_G} / {DEMO_PORTION_G} g
                            </span>
                        </div>
                        <div
                            role="progressbar"
                            aria-label="Poids par rapport à la portion conseillée de démonstration"
                            aria-valuemin={0}
                            aria-valuemax={DEMO_PORTION_G}
                            aria-valuenow={DEMO_WEIGHT_G}
                            className="h-2 overflow-hidden rounded-full bg-neutral-100"
                        >
                            <div className="h-full rounded-full bg-[#5dc28c]" style={{ width: `${(DEMO_WEIGHT_G / DEMO_PORTION_G) * 100}%` }} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <IngredientNutrients per100g={food?.per100g} weightG={DEMO_WEIGHT_G} />
                    </div>
                    <InputError message={errors.food_key || errors.food_name || errors.weight_g} className="mt-3" />
                    <div className="mt-auto pt-8">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => onManual(String(DEMO_WEIGHT_G))}
                            className="mb-4 text-sm underline underline-offset-4 disabled:opacity-50"
                        >
                            Saisir le poids à la main
                        </button>
                        <Button
                            type="submit"
                            disabled={processing || !connected}
                            className="bg-night hover:bg-night/90 h-14 w-full rounded-full text-base text-white"
                        >
                            {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                            Ajouter au repas
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
