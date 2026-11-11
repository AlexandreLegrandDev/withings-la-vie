import type { FoodNutrients } from '@/types';

const nutrients: { key: keyof FoodNutrients; label: string; unit: string; color: string }[] = [
    { key: 'protein_g', label: 'Protéines', unit: 'g', color: 'bg-[#ffd9e8] text-[#a6255c]' },
    { key: 'calcium_mg', label: 'Calcium', unit: 'mg', color: 'bg-[#fff1bc] text-[#756020]' },
    { key: 'iron_mg', label: 'Fer', unit: 'mg', color: 'bg-[#d9ecfa] text-[#315872]' },
    { key: 'b12_ug', label: 'Vitamine B12', unit: 'µg', color: 'bg-[#e0f5e9] text-[#287354]' },
    { key: 'zinc_mg', label: 'Zinc', unit: 'mg', color: 'bg-[#eee5fa] text-[#70518b]' },
];

export function IngredientNutrients({ per100g, weightG }: { per100g?: FoodNutrients; weightG: number }) {
    const validWeight = Number.isFinite(weightG) && weightG > 0;

    return (
        <section aria-label="Apports nutritionnels de la portion">
            <dl className="flex flex-wrap gap-2">
                {nutrients.map(({ key, label, unit, color }) => (
                    <div key={label} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs ${color}`}>
                        <dt>{label}</dt>
                        <dd className="font-mono">
                            {validWeight && per100g?.[key] != null
                                ? `${(Math.round(((per100g[key] * weightG) / 100) * 1000) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} ${unit}`
                                : '—'}
                        </dd>
                    </div>
                ))}
            </dl>
            <p className="mt-2 text-[10px] text-neutral-500">
                {!per100g
                    ? 'Aliment hors catalogue : apports inconnus.'
                    : !validWeight
                      ? 'Renseigne le poids pour afficher les apports.'
                      : 'Apports calculés pour cette portion depuis le catalogue. — : valeur inconnue.'}
            </p>
        </section>
    );
}
