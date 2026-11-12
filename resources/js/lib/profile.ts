/** Libellés du profil, partagés entre l'inscription, la page Profil et les paramètres. */
export const sexLabels: Record<string, string> = { female: 'Femme', male: 'Homme' };

export const dietLabels: Record<string, string> = { vegetarian: 'Végétarien', transition: 'En transition' };

/** Les deux régimes proposés, avec leur description et leur couleur de carte. */
export const dietOptions = [
    { value: 'vegetarian', title: 'Végétarien', description: 'Je suis déjà un régime végétarien.', background: 'bg-mint' },
    { value: 'transition', title: 'En transition', description: 'Je souhaite passer à une alimentation végétarienne.', background: 'bg-sun' },
] as const;
