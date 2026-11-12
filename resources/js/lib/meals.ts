/** Types de repas, identiques à la colonne « type » de la table meals. */
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/** État d'un repas, affiché dans le badge de sa carte. */
export type MealStatus = 'todo' | 'in_progress' | 'done';

/** Ordre d'affichage des repas dans la journée. */
export const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export const mealLabels: Record<MealType, string> = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    snack: 'Collation',
    dinner: 'Dîner',
};

/** « Collation 2 » quand il y a plusieurs collations dans la journée (number vient du serveur, null sinon). */
export const mealLabel = (type: MealType, number?: number | null) => (number ? `${mealLabels[type]} ${number}` : mealLabels[type]);

/** Repas tel que renvoyé par MealController::summary (page Repas, bilan d'un jour). */
export interface MealSummary {
    id: number;
    type: MealType;
    number: number | null;
    status: Exclude<MealStatus, 'todo'>;
    /** Part prévue des besoins du jour, en %. */
    share: number;
    /** Part réelle des besoins du jour apportée par ce repas, de 0 à 100. */
    dayPercent: number;
}
