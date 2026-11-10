import type { Nutrition, Portion } from './types';

const round = (n: number) => Math.round(n * 10) / 10;

export function emptyNutrition(): Nutrition {
    return { kcal: 0, proteins: 0, carbs: 0, fats: 0 };
}

/** Apports d'une portion : valeurs pour 100 g × grammes / 100. */
export function calculateNutrition({ ingredient, grams }: Portion): Nutrition {
    const ratio = grams / 100;
    return {
        kcal: round(ingredient.per100g.kcal * ratio),
        proteins: round(ingredient.per100g.proteins * ratio),
        carbs: round(ingredient.per100g.carbs * ratio),
        fats: round(ingredient.per100g.fats * ratio),
    };
}

/** Somme des apports de plusieurs portions (un repas). */
export function sumNutrition(portions: Portion[]): Nutrition {
    return portions.map(calculateNutrition).reduce(
        (total, n) => ({
            kcal: round(total.kcal + n.kcal),
            proteins: round(total.proteins + n.proteins),
            carbs: round(total.carbs + n.carbs),
            fats: round(total.fats + n.fats),
        }),
        emptyNutrition(),
    );
}
