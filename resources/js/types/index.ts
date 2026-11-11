import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
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
    /** Part du besoin déjà couverte, de 0 à 100. */
    percent: number;
}

/** Bilan d'une journée ou d'un repas (app/Services/DailyIntake.php). */
export interface Intake {
    percent: number;
    nutrients: NutrientIntake[];
    /** Les nutriments les plus en retard, déjà avec leur article : ["du fer", "de la B12"]. */
    missing: string[];
}

/**
 * Aliment proposé pour combler les manques d'un repas.
 * Format prévu pour l'API des aliments : le serveur renvoie une liste vide en attendant.
 */
export interface FoodSuggestion {
    name: string;
    /** Poids conseillé, en grammes. */
    weight_g: number;
    /** Ce que l'aliment apporte, déjà rédigé : « +15 g prot. · +200 mg Ca ». */
    benefits: string;
    /** Badge rose à côté du nom (ex. « La Vie »), facultatif. */
    badge?: string;
}

/** Aliment du catalogue JSON (page « Choisir un aliment »). */
export type FoodNutrients = Record<'protein_g' | 'iron_mg' | 'zinc_mg' | 'calcium_mg' | 'b12_ug', number | null>;

export interface Food {
    key: string;
    name: string;
    /** Rayon du filtre : produits La Vie ou aliments de base. */
    category: 'la_vie' | 'base';
    /** Apports pour 100 g, déjà rédigés : « 15 g prot. · 3 mg fer /100 g ». */
    nutrients: string;
    per100g: FoodNutrients;
    badge?: string | null;
}

export interface User {
    kitchen_scale_connected: boolean;
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
