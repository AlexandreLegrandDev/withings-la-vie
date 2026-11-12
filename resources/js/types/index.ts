export interface Auth {
    user: User;
}

/** Données partagées avec toutes les pages (app/Http/Middleware/HandleInertiaRequests.php). */
export interface SharedData {
    name: string;
    auth: Auth;
    [key: string]: unknown;
}

/** Un nutriment suivi, comparé au besoin (envoyé par app/Services/DailyIntake.php). */
export interface NutrientIntake {
    key: 'protein' | 'iron' | 'b12' | 'calcium' | 'zinc';
    label: string;
    unit: string;
    eaten: number;
    target: number;
    /** Part du besoin couverte, plafonnée à 100 (sert aux moyennes et à la longueur des barres). */
    percent: number;
    /** Part réelle du besoin, sans plafond : 134 quand on a mangé 134 g pour 100 g conseillés. */
    actualPercent: number;
}

/** Bilan d'une journée ou d'un repas (app/Services/DailyIntake.php). */
export interface Intake {
    percent: number;
    nutrients: NutrientIntake[];
    /** Les nutriments les plus en retard, déjà avec leur article : ["du fer", "de la B12"]. */
    missing: string[];
}

/** Bilan d'un repas : en plus, la part réelle de la journée qu'il apporte. */
export interface MealIntake extends Intake {
    dayPercent: number;
    /** Certains aliments ont des apports inconnus : les sommes peuvent être partielles. */
    hasUnknownNutrients: boolean;
}

/** Aliment proposé pour combler les manques de la journée (app/Services/FoodSuggester.php). */
export interface FoodSuggestion {
    /** Clé de l'aliment dans le catalogue. */
    key: string;
    name: string;
    /** Portion proposée, en grammes. */
    weight_g: number;
    /** Ce que la portion apporte, déjà rédigé : « +15 g prot. · +200 mg calcium ». */
    benefits: string;
    /** Badge à côté du nom (ex. « La Vie »), facultatif. */
    badge: string | null;
}

/** Champs nutritionnels du catalogue JSON, pour 100 g (null = inconnu). */
export type FoodNutrientKey = 'protein_g' | 'iron_mg' | 'zinc_mg' | 'calcium_mg' | 'b12_ug';
export type FoodNutrients = Record<FoodNutrientKey, number | null>;

/** Aliment du catalogue JSON (page « Choisir un aliment »). */
export interface Food {
    key: string;
    name: string;
    /** Rayon du filtre : produits La Vie ou aliments de base. */
    category: 'la_vie' | 'base';
    per100g: FoodNutrients;
    /** Nutriments dont la valeur est estimée à partir d'aliments proches (et non mesurée). */
    estimated: FoodNutrientKey[];
    badge: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    kitchen_scale_connected: boolean;
    [key: string]: unknown;
}
