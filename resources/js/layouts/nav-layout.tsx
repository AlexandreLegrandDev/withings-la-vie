import { BottomNav } from '@/components/bottom-nav';
import { useSwipeNavigation } from '@/hooks/use-swipe-navigation';
import { navIndexOf } from '@/lib/nav-links';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { useRef, type ReactNode } from 'react';

/**
 * Layout persistant : Inertia le garde à l'écran d'une page à l'autre et ne remplace que `children`.
 * Le menu n'est donc pas recréé à chaque navigation, ce qui permet à sa bulle de glisser.
 * Il est appliqué automatiquement à toutes les pages dans app.tsx (sauf les pages auth/).
 */
export default function NavLayout({ children }: { children: ReactNode }) {
    const { url } = usePage();
    useSwipeNavigation(url);

    // Sens de l'animation : la nouvelle page arrive par la droite si elle est après l'ancienne dans le menu, sinon par la gauche.
    // On compare la position de la page avec celle de la page précédente (gardée dans un ref entre deux rendus).
    const index = navIndexOf(url);
    const previous = useRef({ url, index, direction: 0 });
    if (previous.current.url !== url) {
        const moved = index !== -1 && previous.current.index !== -1 && index !== previous.current.index;
        previous.current = { url, index, direction: moved ? Math.sign(index - previous.current.index) : 0 };
    }
    const { direction } = previous.current;

    return (
        // overflow-x-clip : la page qui glisse ne crée pas de barre de défilement horizontale
        <div className="overflow-x-clip">
            {/* key={url} : à chaque page, ce bloc est recréé et rejoue son animation d'entrée.
                motion-reduce : pas d'animation si le téléphone demande moins de mouvements. */}
            <div
                key={url}
                className={cn(
                    direction !== 0 && 'animate-in fade-in duration-300 ease-out motion-reduce:animate-none',
                    direction > 0 && 'slide-in-from-right-12',
                    direction < 0 && 'slide-in-from-left-12',
                )}
            >
                {children}
            </div>
            <BottomNav />
        </div>
    );
}
