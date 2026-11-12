import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { FoodNutrientKey, FoodNutrients } from '@/types';

export const foodNutrients: { key: FoodNutrientKey; label: string; short: string; unit: string; color: string }[] = [
    { key: 'protein_g', label: 'Protéines', short: 'prot.', unit: 'g', color: 'bg-rose text-rose-ink' },
    { key: 'calcium_mg', label: 'Calcium', short: 'calcium', unit: 'mg', color: 'bg-sun text-sun-ink' },
    { key: 'iron_mg', label: 'Fer', short: 'fer', unit: 'mg', color: 'bg-sky text-sky-ink' },
    { key: 'b12_ug', label: 'Vitamine B12', short: 'B12', unit: 'µg', color: 'bg-mint text-mint-ink' },
    { key: 'zinc_mg', label: 'Zinc', short: 'zinc', unit: 'mg', color: 'bg-lilac text-lilac-ink' },
];

/** Apports d'une portion de weightG grammes, à partir des valeurs pour 100 g du catalogue. */
export function IngredientNutrients({
    per100g,
    estimated = [],
    weightG,
}: {
    per100g?: FoodNutrients;
    estimated?: FoodNutrientKey[];
    weightG: number;
}) {
    const validWeight = Number.isFinite(weightG) && weightG > 0;

    return (
        <section aria-label="Apports nutritionnels de la portion">
            <dl className="flex flex-wrap gap-2">
                {foodNutrients.map(({ key, label, unit, color }) => {
                    const value = per100g?.[key];
                    const isEstimated = validWeight && estimated.includes(key);

                    return (
                        <div key={key} className={cn('flex items-center gap-1.5 rounded-full px-3 py-2 text-sm', color)}>
                            <dt>{label}</dt>
                            <dd className="font-semibold tabular-nums">
                                {validWeight && value != null ? `${formatNumber((value * weightG) / 100, 2)} ${unit}` : '—'}
                            </dd>
                            {isEstimated && value != null && (
                                <span className="bg-card/70 rounded-full px-1.5 py-0.5 text-xs font-medium" title="Valeur estimée">
                                    estimé
                                </span>
                            )}
                        </div>
                    );
                })}
            </dl>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                {!per100g
                    ? 'Aliment hors catalogue : apports inconnus.'
                    : !validWeight
                      ? 'Renseigne le poids pour afficher les apports.'
                      : estimated.length > 0
                        ? 'Apports de cette portion. « estimé » : valeur calculée à partir d’aliments proches de la table Ciqual. — : valeur inconnue.'
                        : 'Apports de cette portion, d’après la table Ciqual. — : valeur inconnue.'}
            </p>
        </section>
    );
}
