import { ChartNoAxesColumn, CircleDot, House, User, type LucideIcon } from 'lucide-react';

export interface NavLink {
    label: string;
    href: string;
    icon: LucideIcon;
    /** Autres débuts d'URL qui allument aussi ce bouton (ex. les réglages pour Profil). */
    also?: string[];
}

/**
 * Les pages du menu du bas, dans l'ordre d'affichage.
 * Partagé entre le menu (bottom-nav.tsx) et le changement de page en glissant (use-swipe-navigation.ts).
 * Les URLs correspondent aux routes déclarées dans routes/web.php.
 */
export const navLinks: NavLink[] = [
    { label: "Aujourd'hui", href: '/', icon: House, also: ['/bilan'] },
    { label: 'Repas', href: '/repas', icon: CircleDot },
    { label: 'Suivi', href: '/suivi', icon: ChartNoAxesColumn },
    { label: 'Profil', href: '/profil', icon: User, also: ['/settings'] },
];

/** Vrai si l'URL actuelle correspond au lien (exacte pour l'accueil, par préfixe pour les autres). */
export function isActive(currentUrl: string, { href, also = [] }: NavLink) {
    const path = currentUrl.split('?')[0];
    // L'accueil « / » ne peut pas servir de préfixe (toutes les URLs commencent par /) : on le compare en entier
    if (href === '/') return path === '/' || also.some((prefix) => path.startsWith(prefix));
    return [href, ...also].some((prefix) => path.startsWith(prefix));
}

/** Position dans le menu de la page affichée, ou -1 si elle n'en fait pas partie. */
export function navIndexOf(currentUrl: string) {
    // Bilan d'un jour passé (/bilan?date=…) : on y arrive depuis le suivi, c'est donc « Suivi » qui reste allumé
    if (currentUrl.startsWith('/bilan?') && currentUrl.includes('date=')) {
        return navLinks.findIndex((link) => link.href === '/suivi');
    }
    return navLinks.findIndex((link) => isActive(currentUrl, link));
}
