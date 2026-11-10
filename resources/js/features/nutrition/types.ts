/** Apports nutritionnels (pour 100 g, ou pour une portion une fois calculés). */
export interface Nutrition {
    kcal: number;
    proteins: number;
    carbs: number;
    fats: number;
}

export interface Ingredient {
    id: number;
    name: string;
    per100g: Nutrition;
}

/** Un ingrédient pesé sur la balance. */
export interface Portion {
    ingredient: Ingredient;
    grams: number;
}
