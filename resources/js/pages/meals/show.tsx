import { mealLabels, type MealType } from '@/components/meal-card';
import MobileLayout from '@/layouts/mobile-layout';

interface MealShowProps {
    /** Le repas affiché, envoyé par MealController@show. */
    meal: {
        id: number;
        type: MealType;
        /** Jour du repas, au format AAAA-MM-JJ. */
        date: string;
        finished_at: string | null;
    };
}

/** Page d'un repas précis (/repas/{id}). L'onglet « Repas » du menu reste allumé, car l'URL commence par /repas. */
export default function MealShow({ meal }: MealShowProps) {
    // « mardi 10 novembre » ; T12:00 évite qu'un décalage de fuseau fasse afficher la veille
    const day = new Date(`${meal.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <MobileLayout title={mealLabels[meal.type]} backHref={route('meals')}>
            <p className="text-sm text-neutral-500 first-letter:uppercase">{day}</p>

            {/* Contenu du repas à venir (aliments, pesée…) */}
        </MobileLayout>
    );
}
