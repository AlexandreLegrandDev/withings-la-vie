import { navLinks as links, navIndexOf } from '@/lib/nav-links';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export function BottomNav() {
    // usePage().url : l'URL de la page affichée, fournie par Inertia.
    const { url } = usePage();
    const currentIndex = navIndexOf(url);

    // Bouton cliqué dont la page est en cours de chargement : la bulle part dessus tout de suite, sans attendre la réponse du serveur.
    const [clickedIndex, setClickedIndex] = useState<number | null>(null);
    useEffect(() => setClickedIndex(null), [url]);

    const activeIndex = clickedIndex ?? currentIndex;

    return (
        <nav className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-[4%]">
            {/* env(safe-area-inset-bottom) : hauteur de la barre d'accueil des iPhone, pour ne pas passer dessous */}
            <div className="bg-night w-full max-w-md rounded-full p-[1.5%] shadow-lg">
                <ul className="relative flex">
                    {/* La bulle rose : un seul élément, large de 25 %, qu'on fait glisser.
                        translateX(100 %) = décalage d'une fois sa propre largeur, donc d'un bouton.
                        transition-transform anime ce déplacement ; motion-reduce le coupe si le téléphone demande moins d'animations. */}
                    {activeIndex !== -1 && (
                        <li
                            aria-hidden
                            className="bg-brand absolute inset-y-0 left-0 w-1/4 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                            style={{ transform: `translateX(${activeIndex * 100}%)` }}
                        />
                    )}

                    {links.map((link, index) => {
                        const { label, href, icon: Icon } = link;
                        const active = index === activeIndex;
                        return (
                            // w-1/4 : chaque bouton prend exactement 25 % de la barre ; min-w-0 l'empêche de grandir avec son texte
                            <li key={href} className="relative w-1/4 min-w-0">
                                {/* <Link> d'Inertia : change de page sans recharger tout le site */}
                                <Link
                                    href={href}
                                    prefetch
                                    onClick={() => setClickedIndex(index)}
                                    // Si la navigation échoue ou est annulée, la bulle revient sur la page réellement affichée
                                    onFinish={() => setClickedIndex(null)}
                                    aria-current={index === currentIndex ? 'page' : undefined}
                                    className={cn(
                                        // clamp(min, idéal, max) : le texte suit la largeur de l'écran (vw) sans devenir trop petit ni trop grand.
                                        'flex w-full flex-col items-center gap-1 rounded-full px-[8%] py-2 text-[clamp(0.625rem,3vw,0.75rem)] font-medium transition-colors duration-300',
                                        active ? 'text-white' : 'text-neutral-400 hover:text-white',
                                    )}
                                >
                                    {/* L'icône active grossit légèrement */}
                                    <Icon
                                        className={cn(
                                            'size-[clamp(1rem,5vw,1.25rem)] shrink-0 transition-transform duration-300',
                                            active && 'scale-110',
                                        )}
                                        strokeWidth={1.75}
                                    />
                                    {/* truncate : par sécurité, coupe le texte avec « … » sur un écran minuscule plutôt que de déborder */}
                                    <span className="max-w-full truncate">{label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
