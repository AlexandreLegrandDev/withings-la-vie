import { Button } from '@/components/ui/button';
import { calculateNutrition, emptyNutrition } from '@/features/nutrition/calculate-nutrition';
import { NutritionSummary } from '@/features/nutrition/nutrition-summary';
import type { Ingredient } from '@/features/nutrition/types';
import { IngredientPicker } from '@/features/weighing/ingredient-picker';
import { ScalePanel } from '@/features/weighing/scale-panel';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

// `ingredients` arrive directement depuis Laravel (routes/web.php) grâce à Inertia.
export default function Weighing({ ingredients }: { ingredients: Ingredient[] }) {
    const [selected, setSelected] = useState<Ingredient | null>(null);
    const [rawWeight, setRawWeight] = useState(0);
    const [tare, setTare] = useState(0);

    const grams = Math.max(0, rawWeight - tare);
    const nutrition = selected ? calculateNutrition({ ingredient: selected, grams }) : emptyNutrition();

    return (
        <AppLayout breadcrumbs={[{ title: 'Pesée', href: '/pesee' }]}>
            <Head title="Pesée" />
            <div className="grid gap-4 p-4 md:grid-cols-2">
                <ScalePanel rawWeight={rawWeight} tare={tare} onRawWeightChange={setRawWeight} onTare={() => setTare(rawWeight)} />
                <IngredientPicker ingredients={ingredients} selectedId={selected?.id ?? null} onSelect={setSelected} />
                <div className="space-y-4 md:col-span-2">
                    <NutritionSummary nutrition={nutrition} title={selected ? `${grams} g de ${selected.name}` : 'Choisis un ingrédient'} />
                    {/* TODO : enregistrer la portion avec router.post('/journal', …) */}
                    <Button disabled={!selected || grams === 0}>Ajouter au journal</Button>
                </div>
            </div>
        </AppLayout>
    );
}
